import { Prisma } from '@prisma/client';
import type {
	TeachingAttendance,
	TeachingClass,
	TeachingEnrollment,
	TeachingParticipation,
	TeachingSession,
	TeachingStudent,
	TeachingTutorialClass,
} from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { mapClassListItem, mapGradebook } from './mappers';

const now = new Date('2026-08-25T00:00:00.000Z');
const finalizedAt = new Date('2026-08-25T01:00:00.000Z');

const classRow: TeachingClass = {
	id: 'class-1',
	courseCode: 'HRM',
	courseName: 'Human Resource Management',
	groupNo: '01',
	classCode: '01',
	term: 'HK1',
	credits: 3,
	lecturerName: 'Lecturer',
	lecturerCode: 'GV01',
	totalWeeks: 10,
		cpMaxPoints: new Prisma.Decimal(5),
		cpPerAbsence: new Prisma.Decimal(0.5),
		maxParticipationPerSession: new Prisma.Decimal(2),
		attendanceMaxPoints: new Prisma.Decimal(5),
		absenceDeductionPoints: new Prisma.Decimal(0.5),
		lateDeductionPoints: new Prisma.Decimal(0.5),
		lateCountsTowardAbsenceThreshold: true,
		giftDeductionPoints: new Prisma.Decimal(1),
	absenceThresholdPercent: 20,
	lateGraceMinutes: 15,
	status: 'ACTIVE',
	publicSlug: null,
	publicTitle: '',
	publicSummary: '',
	publicDescription: '',
	publicAnnouncement: '',
	attendanceVisible: false,
	classRules: '',
	createdAt: now,
	updatedAt: now,
};

const tutorial: TeachingTutorialClass = {
	id: 'tutorial-1',
	classId: 'class-1',
	code: 'T01',
	name: 'Tutorial 1',
	room: '',
	scheduleNote: '',
	displayOrder: 0,
	createdAt: now,
	updatedAt: now,
};

function session(id: string, weekNumber: number): TeachingSession {
	return {
		id,
		classId: 'class-1',
		tutorialClassId: 'tutorial-1',
		weekNumber,
		heldOn: null,
		topic: '',
		method: 'ROLL_CALL',
		isCancelled: false,
		attendanceTakenAt: finalizedAt,
		attendanceTakenById: null,
		attendanceOpen: false,
		participationTakenAt: finalizedAt,
		participationTakenById: null,
		participationOpen: false,
		createdAt: now,
		updatedAt: now,
	};
}

const student: TeachingStudent = {
	id: 'student-1',
	studentCode: 'SV01',
	familyName: 'Nguyễn',
	givenName: 'An',
	dateOfBirth: new Date('2006-05-29T00:00:00.000Z'),
	homeClassCode: 'K66A',
	majorName: 'HRM',
	phone: null,
	email: null,
	createdAt: now,
	updatedAt: now,
};

const enrollment: TeachingEnrollment = {
	id: 'enrollment-1',
	classId: 'class-1',
	tutorialClassId: 'tutorial-1',
	studentId: 'student-1',
	orderNo: 1,
	enrolledFromWeek: 1,
	status: 'ACTIVE',
	giftCount: 0,
	note: '',
	learningExperience: null,
	learningExperienceSelectedAt: null,
	learningExperienceChangeCount: 0,
	createdAt: now,
	updatedAt: now,
};

function attendance(
	id: string,
	sessionId: string,
	status: TeachingAttendance['status'],
): TeachingAttendance {
	return {
		id,
		sessionId,
		enrollmentId: 'enrollment-1',
		status,
		participationPoints: new Prisma.Decimal(0),
		note: '',
		recordedById: null,
		recordedAt: now,
		createdAt: now,
		updatedAt: now,
	};
}

function participation(id: string, sessionId: string, points: number): TeachingParticipation {
	return {
		id,
		sessionId,
		enrollmentId: 'enrollment-1',
		points: new Prisma.Decimal(points),
		note: '',
		recordedById: null,
		recordedAt: now,
		createdAt: now,
		updatedAt: now,
	};
}

describe('Teaching mappers total-week boundary', () => {
	it('keeps later-week history out of the gradebook and score calculations', () => {
		const sessions = [session('week-1', 1), session('week-11', 11)];
		const attendanceRows = [
			attendance('attendance-1', 'week-1', 'PRESENT'),
			attendance('attendance-11', 'week-11', 'ABSENT_UNEXCUSED'),
		];
		const participationRows = [
			participation('participation-1', 'week-1', 1),
			participation('participation-11', 'week-11', 2),
		];

		const gradebook = mapGradebook({
			classRow,
			tutorials: [tutorial],
			sessions,
			enrollments: [
				{
					...enrollment,
					student,
					attendance: attendanceRows,
					participation: participationRows,
				},
			],
		});

		expect(gradebook.sessions.map((item) => item.id)).toEqual(['week-1']);
		expect(gradebook.stats.sessionsTaken).toBe(1);
		expect(gradebook.students[0]?.marks).toEqual({
			'week-1': { status: 'PRESENT', note: '' },
		});
		expect(gradebook.students[0]?.participation).toEqual({
			'week-1': { points: 1, note: '' },
		});
		expect(gradebook.students[0]?.cp).toMatchObject({
			takenSessions: 1,
			unexcusedAbsences: 0,
			participationTotal: 1,
		});
	});

	it('excludes later-week sessions from class-list aggregates', () => {
		const sessions = [session('week-1', 1), session('week-11', 11)];
		const item = mapClassListItem({
			...classRow,
			tutorials: [tutorial],
			sessions,
			enrollments: [
				{
					id: enrollment.id,
					tutorialClassId: enrollment.tutorialClassId,
					enrolledFromWeek: enrollment.enrolledFromWeek,
					giftCount: enrollment.giftCount,
					attendance: [
						{ status: 'PRESENT', sessionId: 'week-1' },
						{ status: 'ABSENT_UNEXCUSED', sessionId: 'week-11' },
					],
					participation: [
						{ points: new Prisma.Decimal(1), sessionId: 'week-1' },
						{ points: new Prisma.Decimal(2), sessionId: 'week-11' },
					],
				},
			],
			_count: { enrollments: 1, sessions: 2, tutorials: 1 },
		});

		expect(item.sessionCount).toBe(1);
		expect(item.sessionsTaken).toBe(1);
		expect(item.averageCp).toBe(1);
	});
});
