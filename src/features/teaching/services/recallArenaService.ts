import { AppError } from '@/lib/appError';
import { compareNaturalText } from '@/lib/naturalSort';

import { keepHigherCp, pickDefaultArenaSession, vietnamTodayIso } from '../domain/recallArena';
import * as repo from '../repositories/teachingRepository';
import type { RecallArenaAwardInput } from '../schemas';
import type { RecallArenaAwardResult, RecallArenaData } from '../types';
import { getGradebook, notFound } from './classService';

const ACTIVE_ARENA_DECKS = { not: 'ARCHIVED' } as const;

/**
 * Everything the course arena needs in one load: every active class with its
 * roster, attendance and CP, and every lesson deck of the course that has
 * cards. Archived decks and empty decks are left out.
 */
export async function getRecallArena(courseId: string): Promise<RecallArenaData> {
	const course = await repo.getCourse(courseId);
	if (!course) notFound('Course');
	const [classRows, deckRows] = await Promise.all([
		repo.prisma.teachingClass.findMany({
			where: { courseId, status: 'ACTIVE' },
			select: { id: true },
		}),
		repo.prisma.activeRecallDeck.findMany({
			where: { courseId, status: ACTIVE_ARENA_DECKS },
			orderBy: [{ position: 'asc' }, { title: 'asc' }],
			select: {
				id: true,
				title: true,
				lessonLabel: true,
				status: true,
				_count: { select: { cards: true } },
			},
		}),
	]);
	const classIds = classRows.map((row) => row.id);
	const decks = deckRows.filter((deck) => deck._count.cards > 0);
	const [gradebooks, groups, links, cards] = await Promise.all([
		Promise.all(classIds.map((id) => getGradebook(id))),
		repo.prisma.teachingEnrollment.findMany({
			where: { classId: { in: classIds } },
			select: { id: true, learningExperience: true },
		}),
		repo.prisma.teachingClassRecallDeck.findMany({
			where: { classId: { in: classIds }, enabled: true },
			select: { classId: true, deckId: true },
		}),
		decks.length
			? repo.prisma.activeRecallCard.findMany({
					where: { deckId: { in: decks.map((deck) => deck.id) } },
					orderBy: [{ deckId: 'asc' }, { position: 'asc' }],
					select: {
						id: true,
						deckId: true,
						question: true,
						answer: true,
						questionVi: true,
						answerVi: true,
					},
				})
			: Promise.resolve([]),
	]);
	const groupByEnrollment = new Map(groups.map((row) => [row.id, row.learningExperience]));
	const deckIds = new Set(decks.map((deck) => deck.id));
	const todayIso = vietnamTodayIso();
	const sortedBooks = [...gradebooks].sort((left, right) =>
		compareNaturalText(
			left.class.classCode ?? left.class.groupNo,
			right.class.classCode ?? right.class.groupNo,
		),
	);

	return {
		course: { id: course.id, courseCode: course.courseCode, courseName: course.courseName },
		todayIso,
		classes: sortedBooks.map((gradebook) => {
			const sessions = gradebook.sessions.filter((session) => !session.isCancelled);
			return {
				id: gradebook.class.id,
				classCode: gradebook.class.classCode ?? gradebook.class.groupNo,
				term: gradebook.class.term,
				tutorials: gradebook.tutorials.map((tutorial) => ({
					id: tutorial.id,
					code: tutorial.code,
					name: tutorial.name,
				})),
				sessions,
				defaultSessionId: pickDefaultArenaSession(sessions, todayIso)?.id ?? null,
				enabledDeckIds: links
					.filter((link) => link.classId === gradebook.class.id && deckIds.has(link.deckId))
					.map((link) => link.deckId),
			};
		}),
		players: sortedBooks.flatMap((gradebook) =>
			gradebook.students
				.filter((student) => student.status === 'ACTIVE')
				.map((student) => ({
					enrollmentId: student.enrollmentId,
					classId: gradebook.class.id,
					tutorialClassId: student.tutorialClassId,
					enrolledFromWeek: student.enrolledFromWeek,
					studentCode: student.studentCode,
					familyName: student.familyName,
					givenName: student.givenName,
					group: groupByEnrollment.get(student.enrollmentId) ?? null,
					attendance: Object.fromEntries(
						Object.entries(student.marks).map(([sessionId, mark]) => [sessionId, mark.status]),
					),
					cp: Object.fromEntries(
						Object.entries(student.participation).map(([sessionId, mark]) => [
							sessionId,
							mark.points,
						]),
					),
				})),
		),
		decks: decks.map((deck) => ({
			deckId: deck.id,
			title: deck.title,
			lessonLabel: deck.lessonLabel,
			status: deck.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
			cardCount: deck._count.cards,
		})),
		cards,
	};
}

/** The course a class belongs to, so the old per-class arena link can redirect. */
export async function getRecallArenaCourseId(classId: string): Promise<string> {
	const teachingClass = await repo.getClass(classId);
	if (!teachingClass) notFound('Class');
	return teachingClass.courseId;
}

/**
 * Record a correct arena answer as CP for that week, keeping the higher of the
 * existing mark and the award. The existing note is preserved.
 */
export async function awardRecallArenaCp(
	sessionId: string,
	input: RecallArenaAwardInput,
	userId?: string,
): Promise<RecallArenaAwardResult> {
	const session = await repo.getSession(sessionId);
	if (!session) notFound('Session');
	if (session.isCancelled)
		throw new AppError('Buổi học này đã bị hủy, không thể chấm CP', 422, 'VALIDATION');
	if (!session.participationOpen)
		throw new AppError('CP tuần này đang khóa. Mở chấm CP rồi chấm lại.', 409, 'CONFLICT');
	const [enrollment] = await repo.getEnrollmentsByIds([input.enrollmentId]);
	if (
		!enrollment ||
		enrollment.status !== 'ACTIVE' ||
		enrollment.classId !== session.classId ||
		enrollment.tutorialClassId !== session.tutorialClassId
	) {
		notFound('Enrollment');
	}
	if (enrollment.enrolledFromWeek > session.weekNumber) {
		throw new AppError('Sinh viên chưa vào lớp ở tuần này', 422, 'VALIDATION');
	}
	const existing = await repo.prisma.teachingParticipation.findUnique({
		where: { sessionId_enrollmentId: { sessionId, enrollmentId: input.enrollmentId } },
		select: { points: true, note: true },
	});
	const previous = existing ? Number(existing.points) : 0;
	const points = keepHigherCp(previous, input.points);
	if (points !== previous) {
		await repo.upsertParticipationMarks(sessionId, [
			{
				enrollmentId: input.enrollmentId,
				points,
				note: existing?.note ?? '',
				recordedById: userId ?? null,
			},
		]);
	}
	return {
		enrollmentId: input.enrollmentId,
		sessionId,
		previous,
		points,
		changed: points !== previous,
	};
}
