import type {
	TeachingAttendance,
	TeachingClass,
	TeachingEnrollment,
	TeachingParticipation,
	TeachingSession,
	TeachingStudent,
	TeachingTutorialClass,
} from '@prisma/client';

import {
	hasAuthoredStudentPage,
	isClassShared,
	isCustomizedSession,
	summarizeClassDeleteBlockers,
	type ClassUserContentSnapshot,
} from '../domain/adminLifecycle';
import {
	computeCp,
	isParticipationCounted,
	sessionsForEnrollment,
	type CpPolicy,
	type SessionCpInput,
} from '../domain/cp';
import { toIso, toIsoDate, toNumber } from '../domain/prismaErrors';
import type {
	TeachingAttendanceMark,
	TeachingClassListItem,
	TeachingClassRecord,
	TeachingGradebook,
	TeachingGradebookStudent,
	TeachingParticipationMark,
	TeachingRosterStudent,
	TeachingSessionRecord,
	TeachingTutorialRecord,
} from '../types';

export function mapClass(row: TeachingClass): TeachingClassRecord {
	return {
		id: row.id,
		courseId: row.courseId,
		courseCode: row.courseCode,
		courseName: row.courseName,
		groupNo: row.groupNo,
		classCode: row.classCode || row.groupNo,
		term: row.term,
		credits: row.credits,
		lecturerName: row.lecturerName,
		lecturerCode: row.lecturerCode,
		totalWeeks: row.totalWeeks,
		attendanceMaxPoints: toNumber(row.attendanceMaxPoints),
		cpMaxPoints: toNumber(row.cpMaxPoints),
		absenceDeductionPoints: toNumber(row.absenceDeductionPoints),
		lateDeductionPoints: toNumber(row.lateDeductionPoints),
		lateCountsTowardAbsenceThreshold: row.lateCountsTowardAbsenceThreshold,
		giftDeductionPoints: toNumber(row.giftDeductionPoints),
		absenceThresholdPercent: row.absenceThresholdPercent,
		lateGraceMinutes: row.lateGraceMinutes,
		status: row.status,
		publicSlug: row.publicSlug,
		publicTitle: row.publicTitle,
		publicSummary: row.publicSummary,
		publicDescription: row.publicDescription,
		publicAnnouncement: row.publicAnnouncement,
		attendanceVisible: row.attendanceVisible,
		classRules: row.classRules,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}

export function policyFromClass(row: TeachingClass): CpPolicy {
	return {
		totalWeeks: row.totalWeeks,
		absenceThresholdPercent: row.absenceThresholdPercent,
		attendanceMaxPoints: toNumber(row.attendanceMaxPoints),
		cpMaxPoints: toNumber(row.cpMaxPoints),
		absenceDeductionPoints: toNumber(row.absenceDeductionPoints),
		lateDeductionPoints: toNumber(row.lateDeductionPoints),
		lateCountsTowardAbsenceThreshold: row.lateCountsTowardAbsenceThreshold,
		giftDeductionPoints: toNumber(row.giftDeductionPoints),
	};
}

export function mapTutorial(row: TeachingTutorialClass, studentCount = 0): TeachingTutorialRecord {
	return {
		id: row.id,
		classId: row.classId,
		code: row.code,
		name: row.name,
		room: row.room,
		scheduleNote: row.scheduleNote,
		displayOrder: row.displayOrder,
		studentCount,
	};
}

export function mapSession(row: TeachingSession): TeachingSessionRecord {
	return {
		id: row.id,
		classId: row.classId,
		tutorialClassId: row.tutorialClassId,
		weekNumber: row.weekNumber,
		heldOn: toIsoDate(row.heldOn),
		topic: row.topic,
		method: row.method,
		isCancelled: row.isCancelled,
		attendanceTakenAt: toIso(row.attendanceTakenAt),
		attendanceOpen: Boolean(row.attendanceOpen),
		participationTakenAt: toIso(row.participationTakenAt),
		participationOpen: Boolean(row.participationOpen),
	};
}

export function mapRosterStudent(
	enrollment: TeachingEnrollment & { student: TeachingStudent },
): TeachingRosterStudent {
	return {
		enrollmentId: enrollment.id,
		studentId: enrollment.studentId,
		orderNo: enrollment.orderNo,
		tutorialClassId: enrollment.tutorialClassId,
		enrolledFromWeek: enrollment.enrolledFromWeek,
		status: enrollment.status,
		giftCount: enrollment.giftCount,
		studentCode: enrollment.student.studentCode,
		familyName: enrollment.student.familyName,
		givenName: enrollment.student.givenName,
		homeClassCode: enrollment.student.homeClassCode,
		majorName: enrollment.student.majorName,
		dateOfBirth: toIsoDate(enrollment.student.dateOfBirth),
		email: enrollment.student.email,
		note: enrollment.note,
		learningExperience: enrollment.learningExperience,
		learningExperienceChangeCount: enrollment.learningExperienceChangeCount,
		learningExperienceSelectedAt: toIso(enrollment.learningExperienceSelectedAt),
	};
}

export function mapGradebookStudent(
	enrollment: TeachingEnrollment & {
		student: TeachingStudent;
		attendance: TeachingAttendance[];
		participation: TeachingParticipation[];
	},
	sessions: TeachingSession[],
	policy: CpPolicy,
): TeachingGradebookStudent {
	const tutorialSessions = sessionsForEnrollment(
		sessions.filter(
			(session) =>
				session.weekNumber <= policy.totalWeeks &&
				session.tutorialClassId === enrollment.tutorialClassId,
		),
		enrollment.enrolledFromWeek,
	);
	const marks: Record<string, TeachingAttendanceMark> = {};
	const participation: Record<string, TeachingParticipationMark> = {};
	const attendanceBySession = new Map(enrollment.attendance.map((mark) => [mark.sessionId, mark]));
	const participationBySession = new Map(
		enrollment.participation.map((mark) => [mark.sessionId, mark]),
	);
	const cpSessions: SessionCpInput[] = tutorialSessions.map((session) => {
		const mark = attendanceBySession.get(session.id);
		const participationMark = participationBySession.get(session.id);
		if (mark) {
			marks[session.id] = {
				status: mark.status,
				note: mark.note,
			};
		}
		if (participationMark) {
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
		...mapRosterStudent(enrollment),
		marks,
		participation,
		cp: computeCp(
			policy,
			cpSessions,
			tutorialSessions
				.filter(isParticipationCounted)
				.map((session) => participation[session.id]?.points ?? 0),
			enrollment.giftCount,
		),
	};
}

export function summarizeStudents(students: TeachingGradebookStudent[]) {
	const active = students.filter((student) => student.status === 'ACTIVE');
	const bannedCount = active.filter((student) => student.cp.banned).length;
	const atRiskCount = active.filter((student) => student.cp.riskLevel === 'AT_RISK').length;
	const average = (selector: (student: TeachingGradebookStudent) => number) =>
		active.length === 0
			? null
			: Math.round(
					(active.reduce((sum, student) => sum + selector(student), 0) / active.length) * 100,
				) / 100;
	return {
		studentCount: active.length,
		averageAttendance: average((student) => student.cp.attendanceScore),
		averageCp: average((student) => student.cp.cp),
		averageTotal: average((student) => student.cp.totalScore),
		atRiskCount,
		bannedCount,
	};
}

export function mapGradebook(params: {
	classRow: TeachingClass;
	tutorials: TeachingTutorialClass[];
	sessions: TeachingSession[];
	enrollments: Array<
		TeachingEnrollment & {
			student: TeachingStudent;
			attendance: TeachingAttendance[];
			participation: TeachingParticipation[];
		}
	>;
}): TeachingGradebook {
	const policy = policyFromClass(params.classRow);
	const sessions = params.sessions.filter((session) => session.weekNumber <= policy.totalWeeks);
	const students = params.enrollments.map((enrollment) =>
		mapGradebookStudent(enrollment, sessions, policy),
	);
	const counts = new Map<string, number>();
	for (const student of students) {
		if (student.tutorialClassId && student.status === 'ACTIVE') {
			counts.set(student.tutorialClassId, (counts.get(student.tutorialClassId) ?? 0) + 1);
		}
	}
	const stats = summarizeStudents(students);
	return {
		class: mapClass(params.classRow),
		policy,
		tutorials: params.tutorials.map((tutorial) =>
			mapTutorial(tutorial, counts.get(tutorial.id) ?? 0),
		),
		sessions: sessions.map(mapSession),
		students,
		stats: {
			...stats,
			sessionsTaken: sessions.filter(
				(session) => session.attendanceTakenAt && !session.attendanceOpen && !session.isCancelled,
			).length,
		},
	};
}

export function classSnapshotFromListRow(row: {
	publicTitle?: string | null;
	publicSummary?: string | null;
	publicDescription?: string | null;
	publicAnnouncement?: string | null;
	classRules?: string | null;
	attendanceVisible?: boolean;
	publicSlug?: string | null;
	enrollments: Array<{
		attendance: unknown[];
		participation: unknown[];
	}>;
	sessions: Array<{
		heldOn: Date | string | null;
		topic?: string;
		method?: string;
		isCancelled: boolean;
		attendanceTakenAt: Date | string | null;
		participationTakenAt: Date | string | null;
	}>;
	groupBoards?: Array<{ groupCount: number; _count: { assignments: number } }>;
	_count: { enrollments: number; notes?: number; publicLinks?: number };
}): ClassUserContentSnapshot {
	return {
		enrollmentCount: row._count.enrollments,
		attendanceCount: row.enrollments.reduce((sum, item) => sum + item.attendance.length, 0),
		participationCount: row.enrollments.reduce((sum, item) => sum + item.participation.length, 0),
		configuredGroupCount: (row.groupBoards ?? []).filter(
			(board) => board.groupCount > 0 || board._count.assignments > 0,
		).length,
		noteCount: row._count.notes ?? 0,
		publicLinkCount: row._count.publicLinks ?? 0,
		customizedSessionCount: row.sessions.filter((session) =>
			isCustomizedSession({
				heldOn: session.heldOn,
				topic: session.topic ?? '',
				method: session.method ?? 'ROLL_CALL',
				isCancelled: session.isCancelled,
				attendanceTakenAt: session.attendanceTakenAt,
				participationTakenAt: session.participationTakenAt,
			}),
		).length,
		studentPageCount: hasAuthoredStudentPage(row) ? 1 : 0,
		sharingCount: isClassShared(row) ? 1 : 0,
	};
}

export function classSnapshotFromLifecycle(row: {
	publicTitle?: string | null;
	publicSummary?: string | null;
	publicDescription?: string | null;
	publicAnnouncement?: string | null;
	classRules?: string | null;
	attendanceVisible?: boolean;
	publicSlug?: string | null;
	_count: { enrollments: number; notes: number; publicLinks: number };
	sessions: Array<{
		heldOn: Date | string | null;
		topic: string;
		method: string;
		isCancelled: boolean;
		attendanceTakenAt: Date | string | null;
		participationTakenAt: Date | string | null;
		_count: { attendance: number; participation: number };
	}>;
	groupBoards: Array<{ groupCount: number; _count: { assignments: number } }>;
}): ClassUserContentSnapshot {
	return {
		enrollmentCount: row._count.enrollments,
		attendanceCount: row.sessions.reduce((sum, session) => sum + session._count.attendance, 0),
		participationCount: row.sessions.reduce(
			(sum, session) => sum + session._count.participation,
			0,
		),
		configuredGroupCount: row.groupBoards.filter(
			(board) => board.groupCount > 0 || board._count.assignments > 0,
		).length,
		noteCount: row._count.notes,
		publicLinkCount: row._count.publicLinks,
		customizedSessionCount: row.sessions.filter((session) => isCustomizedSession(session)).length,
		studentPageCount: hasAuthoredStudentPage(row) ? 1 : 0,
		sharingCount: isClassShared(row) ? 1 : 0,
	};
}

export function mapClassListItem(
	row: TeachingClass & {
		tutorials: TeachingTutorialClass[];
		sessions: Array<
			Pick<
				TeachingSession,
				| 'id'
				| 'tutorialClassId'
				| 'weekNumber'
				| 'heldOn'
				| 'topic'
				| 'method'
				| 'attendanceTakenAt'
				| 'attendanceOpen'
				| 'participationTakenAt'
				| 'participationOpen'
				| 'isCancelled'
			>
		>;
		enrollments: Array<{
			id: string;
			tutorialClassId: string | null;
			enrolledFromWeek: number;
			giftCount: number;
			attendance: Array<{ status: TeachingAttendance['status']; sessionId: string }>;
			participation: Array<{ points: TeachingParticipation['points']; sessionId: string }>;
		}>;
		groupBoards?: Array<{ groupCount: number; _count: { assignments: number } }>;
		_count: {
			enrollments: number;
			sessions: number;
			tutorials: number;
			notes?: number;
			publicLinks?: number;
		};
	},
): TeachingClassListItem {
	const policy = policyFromClass(row);
	const scopedSessions = row.sessions.filter((session) => session.weekNumber <= policy.totalWeeks);
	const students = row.enrollments.map((enrollment) => {
		const sessions = sessionsForEnrollment(
			scopedSessions.filter((session) => session.tutorialClassId === enrollment.tutorialClassId),
			enrollment.enrolledFromWeek,
		);
		return computeCp(
			policy,
			sessions.map((session) => {
				const mark = enrollment.attendance.find((item) => item.sessionId === session.id);
				return {
					isCancelled: session.isCancelled,
					attendanceTakenAt: session.attendanceTakenAt,
					attendanceOpen: session.attendanceOpen,
					status: mark?.status ?? null,
				};
			}),
			sessions
				.filter(isParticipationCounted)
				.map((session) =>
					toNumber(
						enrollment.participation.find((mark) => mark.sessionId === session.id)?.points ?? 0,
					),
				),
			enrollment.giftCount,
		);
	});
	const bannedCount = students.filter((cp) => cp.banned).length;
	const atRiskCount = students.filter((cp) => cp.riskLevel === 'AT_RISK').length;
	const average = (selector: (cp: ReturnType<typeof computeCp>) => number) =>
		students.length === 0
			? null
			: Math.round((students.reduce((sum, cp) => sum + selector(cp), 0) / students.length) * 100) /
				100;
	const deleteBlockers = summarizeClassDeleteBlockers(classSnapshotFromListRow(row));
	return {
		...mapClass(row),
		studentCount: row.enrollments.length,
		tutorialCount: row._count.tutorials,
		sessionsTaken: scopedSessions.filter(
			(session) => session.attendanceTakenAt && !session.attendanceOpen && !session.isCancelled,
		).length,
		sessionCount: scopedSessions.length,
		averageAttendance: average((cp) => cp.attendanceScore),
		averageCp: average((cp) => cp.cp),
		averageTotal: average((cp) => cp.totalScore),
		atRiskCount,
		bannedCount,
		canDelete: Object.keys(deleteBlockers).length === 0,
		deleteBlockers,
	};
}
