import { AppError } from '@/lib/appError';

import { keepHigherCp, pickDefaultArenaSession, vietnamTodayIso } from '../domain/recallArena';
import * as repo from '../repositories/teachingRepository';
import type { RecallArenaAwardInput } from '../schemas';
import type { RecallArenaAwardResult, RecallArenaData } from '../types';
import { getGradebook, notFound } from './classService';
import { listClassRecallAssignments } from './recallPlacementService';

/** Everything the arena needs in one load: roster, attendance, CP and the class's recall cards. */
export async function getRecallArena(classId: string): Promise<RecallArenaData> {
	const [gradebook, assignments, groups] = await Promise.all([
		getGradebook(classId),
		listClassRecallAssignments(classId),
		repo.prisma.teachingEnrollment.findMany({
			where: { classId },
			select: { id: true, learningExperience: true },
		}),
	]);
	const groupByEnrollment = new Map(groups.map((row) => [row.id, row.learningExperience]));
	const decks = assignments.filter(
		(assignment) => assignment.enabled && assignment.status === 'PUBLISHED',
	);
	const cardRows = decks.length
		? await repo.prisma.activeRecallCard.findMany({
				where: { deckId: { in: decks.map((deck) => deck.deckId) } },
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
		: [];
	const sessions = gradebook.sessions.filter((session) => !session.isCancelled);

	return {
		class: {
			id: gradebook.class.id,
			courseCode: gradebook.class.courseCode,
			courseName: gradebook.class.courseName,
			classCode: gradebook.class.classCode ?? gradebook.class.groupNo,
		},
		tutorials: gradebook.tutorials.map((tutorial) => ({
			id: tutorial.id,
			code: tutorial.code,
			name: tutorial.name,
		})),
		sessions,
		defaultSessionId: pickDefaultArenaSession(sessions, vietnamTodayIso())?.id ?? null,
		players: gradebook.students
			.filter((student) => student.status === 'ACTIVE')
			.map((student) => ({
				enrollmentId: student.enrollmentId,
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
		decks: decks.map((deck) => ({
			deckId: deck.deckId,
			title: deck.title,
			lessonLabel: deck.lessonLabel,
			cardCount: deck.cardCount,
		})),
		cards: cardRows,
	};
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
