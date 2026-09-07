import { AppError } from '@/lib/appError';
import { routes } from '@/config/routes';

import { computeCp, isAttendanceCounted, isParticipationCounted, sessionsForEnrollment } from '../domain/cp';
import { maskStudentCode } from '../domain/privacy';
import { toNumber, withUniqueConflict } from '../domain/prismaErrors';
import * as repo from '../repositories/teachingRepository';
import type { ShareTeachingClassInput } from '../schemas';
import type {
	PublicClassBoard,
	PublicAttendanceBoardStudent,
	TeachingAttendanceBoardConfig,
} from '../types';
import { notFound } from './classService';
import { mapClass, mapSession, mapTutorial, policyFromClass } from './mappers';
import { mapPublicClassNote } from './classNoteService';
import { listPublishedRecallDecksForClass } from '@/features/active-recall';

function boardPath(slug: string | null): string | null {
	if (!slug) return null;
	return routes.teachingPublicClass(slug);
}

function mapBoardConfig(
	row: {
		publicSlug: string | null;
		attendanceVisible: boolean;
		classRules: string;
	} & Parameters<typeof mapClass>[0],
): TeachingAttendanceBoardConfig {
	return {
		class: mapClass(row),
		attendanceVisible: row.attendanceVisible,
		classRules: row.classRules,
		publicPath: boardPath(row.publicSlug),
	};
}

export async function getAttendanceBoardConfig(
	classId: string,
): Promise<TeachingAttendanceBoardConfig> {
	const row = await repo.getClass(classId);
	if (!row) notFound();
	return mapBoardConfig(row);
}

function defaultPublicSlug(courseCode: string, groupNo: string, term: string) {
	return `${courseCode}-${groupNo}-${term}`
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 80);
}

export async function shareTeachingClass(classId: string, input: ShareTeachingClassInput) {
	const existing = await repo.getPublicPageConfig(classId);
	if (!existing) notFound();
	if (input.shared && existing.status !== 'ACTIVE') {
		throw new AppError('Activate the class before sharing it', 409, 'CONFLICT');
	}
	const shared = input.shared;
	const updated = await withUniqueConflict('This public URL is already used by another class', () =>
		repo.updateShareState(classId, {
			publicSlug:
				existing.publicSlug ||
				defaultPublicSlug(existing.courseCode, existing.groupNo, existing.term),
			publicTitle: existing.publicTitle || existing.courseName,
			publicSummary:
				existing.publicSummary ||
				`${existing.courseCode} · Nhóm ${existing.groupNo} · ${existing.term}`,
			attendanceVisible: shared,
			classRules: input.classRules ?? existing.classRules,
		}),
	);
	return mapBoardConfig(updated);
}

export async function getClassIdBySlug(slug: string): Promise<string | null> {
	return repo.getClassIdBySlug(slug);
}

export async function getPublicClassBoard(slug: string): Promise<PublicClassBoard | null> {
	const row = await repo.getAttendanceBoardBySlug(slug);
	if (!row || !row.publicSlug) return null;

	const policy = policyFromClass(row);
	const sessions = row.sessions.filter((session) => session.weekNumber <= policy.totalWeeks);
	const counts = new Map<string, number>();
	const students: PublicAttendanceBoardStudent[] = row.enrollments.map((enrollment) => {
		if (enrollment.tutorialClassId && enrollment.status === 'ACTIVE') {
			counts.set(enrollment.tutorialClassId, (counts.get(enrollment.tutorialClassId) ?? 0) + 1);
		}
		const tutorialSessions = sessionsForEnrollment(
			sessions.filter((session) => session.tutorialClassId === enrollment.tutorialClassId),
			enrollment.enrolledFromWeek,
		);
		const marks: PublicAttendanceBoardStudent['marks'] = {};
		const participation: PublicAttendanceBoardStudent['participation'] = {};
		const attendanceBySession = new Map(
			enrollment.attendance.map((mark) => [mark.sessionId, mark]),
		);
		const participationBySession = new Map(
			(enrollment.participation ?? []).map((mark) => [mark.sessionId, mark]),
		);
		const cpSessions = tutorialSessions.map((session) => {
			const mark = attendanceBySession.get(session.id);
			const participationMark = participationBySession.get(session.id);
			if (mark && isAttendanceCounted(session)) {
				marks[session.id] = {
					status: mark.status,
					note: mark.note,
				};
			}
			if (participationMark && isParticipationCounted(session)) {
				participation[session.id] = {
					points: toNumber(participationMark.points),
					note: participationMark.note,
				};
			}
			return {
				isCancelled: session.isCancelled,
				attendanceTakenAt: session.attendanceTakenAt,
				attendanceOpen: session.attendanceOpen,
				participationTakenAt: session.participationTakenAt,
				participationOpen: session.participationOpen,
				status: mark?.status ?? null,
			};
		});
		return {
			enrollmentId: enrollment.id,
			orderNo: enrollment.orderNo,
			tutorialClassId: enrollment.tutorialClassId,
			studentCode: maskStudentCode(enrollment.student.studentCode),
			familyName: enrollment.student.familyName,
			givenName: enrollment.student.givenName,
			hasDateOfBirth: Boolean(enrollment.student.dateOfBirth),
			enrolledFromWeek: enrollment.enrolledFromWeek,
			marks,
			participation,
			learningExperience: enrollment.learningExperience,
			cp: computeCp(
				policy,
				cpSessions,
				tutorialSessions
					.filter(isParticipationCounted)
					.map((session) => participation[session.id]?.points ?? 0),
				enrollment.giftCount,
			),
		};
	});

	const recallDecks = await listPublishedRecallDecksForClass(row.id);

	return {
		slug: row.publicSlug,
		title: row.publicTitle || row.courseName,
		courseId: row.courseId,
		summary: row.publicSummary,
		description: row.publicDescription,
		announcement: row.publicAnnouncement,
		courseCode: row.courseCode,
		courseName: row.courseName,
		groupNo: row.groupNo,
		classCode: row.classCode || row.groupNo,
		term: row.term,
		credits: row.credits,
		lecturerName: row.lecturerName,
		rules: row.classRules,
		updatedAt: row.updatedAt.toISOString(),
		policy,
		tutorials: row.tutorials.map((tutorial) => mapTutorial(tutorial, counts.get(tutorial.id) ?? 0)),
		sessions: sessions.map(mapSession),
		students,
		links: row.publicLinks.map((link) => ({
			id: link.id,
			label: link.label,
			url: link.url,
			description: link.description,
			displayOrder: link.displayOrder,
		})),
		notes: (row.notes ?? []).flatMap((note) => {
			const mapped = mapPublicClassNote(note);
			return mapped ? [mapped] : [];
		}),
		recallDecks: recallDecks.map((deck) => ({
			id: deck.id,
			slug: deck.slug,
			title: deck.title,
			lessonLabel: deck.lessonLabel,
			description: deck.description,
			cardCount: deck.cardCount,
		})),
	};
}

export const getPublicAttendanceBoard = getPublicClassBoard;
