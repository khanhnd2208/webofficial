import { describe, expect, it } from 'vitest';

import {
	computeCp,
	DEFAULT_CP_POLICY,
	defaultEnrolledFromWeek,
	sessionsForEnrollment,
	type SessionCpInput,
} from './cp';

function taken(status: SessionCpInput['status']): SessionCpInput {
	return {
		isCancelled: false,
		attendanceTakenAt: '2026-09-01T00:00:00.000Z',
		status,
	};
}

function blank(): SessionCpInput {
	return taken(null);
}

describe('computeCp', () => {
	it('starts Attendance at 5 and CP at 0 when there are no absences or CP marks', () => {
		const result = computeCp(
			DEFAULT_CP_POLICY,
			Array.from({ length: 10 }, () => taken('PRESENT')),
		);
		expect(result.cp).toBe(0);
		expect(result.attendanceScore).toBe(5);
		expect(result.totalScore).toBe(5);
		expect(result.unexcusedAbsences).toBe(0);
		expect(result.riskLevel).toBe('OK');
		expect(result.examEligible).toBe(true);
	});

	it('deducts 0.5 Attendance per unexcused absence', () => {
		const sessions = [
			taken('PRESENT'),
			taken('ABSENT_UNEXCUSED'),
			taken('PRESENT'),
			blank(),
			taken('PRESENT'),
		];
		const result = computeCp(DEFAULT_CP_POLICY, sessions);
		expect(result.unexcusedAbsences).toBe(2);
		expect(result.absenceDeduction).toBe(1);
		expect(result.attendanceScore).toBe(4);
		expect(result.totalScore).toBe(4);
		expect(result.riskLevel).toBe('AT_RISK');
	});

	it('treats LATE as an unexcused absence', () => {
		const result = computeCp(DEFAULT_CP_POLICY, [taken('LATE'), taken('PRESENT')]);
		expect(result.lateCount).toBe(1);
		expect(result.unexcusedAbsences).toBe(1);
		expect(result.cp).toBe(0);
		expect(result.attendanceScore).toBe(4.5);
	});

	it('floors Attendance at zero after many absences', () => {
		const result = computeCp(
			DEFAULT_CP_POLICY,
			Array.from({ length: 20 }, () => taken('ABSENT_UNEXCUSED')),
		);
		expect(result.absenceDeduction).toBe(10);
		expect(result.attendanceScore).toBe(0);
		expect(result.totalScore).toBe(0);
	});

	it('does not deduct excused absences from CP or the ban threshold', () => {
		const result = computeCp(DEFAULT_CP_POLICY, [
			taken('ABSENT_EXCUSED'),
			taken('ABSENT_EXCUSED'),
			taken('ABSENT_EXCUSED'),
			taken('PRESENT'),
		]);
		expect(result.excusedAbsences).toBe(3);
		expect(result.unexcusedAbsences).toBe(0);
		expect(result.cp).toBe(0);
		expect(result.attendanceScore).toBe(5);
		expect(result.banned).toBe(false);
	});

	it('counts MAKEUP as present', () => {
		const result = computeCp(DEFAULT_CP_POLICY, [taken('MAKEUP'), taken('PRESENT')], [1, 0]);
		expect(result.makeupCount).toBe(1);
		expect(result.unexcusedAbsences).toBe(0);
		expect(result.cp).toBe(1);
		expect(result.attendanceScore).toBe(5);
		expect(result.totalScore).toBe(6);
		expect(result.participationTotal).toBe(1);
	});

	it('adds independent participation points and caps CP at the maximum', () => {
		const result = computeCp(
			DEFAULT_CP_POLICY,
			[taken('PRESENT'), taken('ABSENT_UNEXCUSED')],
			[2, 2, 2, 2, 2, 2],
		);
		expect(result.participationTotal).toBe(12);
		expect(result.cp).toBe(5);
		expect(result.attendanceScore).toBe(4.5);
		expect(result.totalScore).toBe(9.5);
	});

	it('subtracts Gift after capping accumulated CP and never goes below zero', () => {
		const capped = computeCp(DEFAULT_CP_POLICY, [taken('PRESENT')], [2, 2, 2, 2, 2, 2], 1);
		expect(capped.participationTotal).toBe(12);
		expect(capped.giftDeduction).toBe(1);
		expect(capped.cp).toBe(4);
		expect(capped.totalScore).toBe(9);

		const floored = computeCp(DEFAULT_CP_POLICY, [taken('PRESENT')], [0.5], 3);
		expect(floored.giftDeduction).toBe(3);
		expect(floored.cp).toBe(0);
	});

	it('keeps lecturer-entered participation points for any attendance status', () => {
		const result = computeCp(
			DEFAULT_CP_POLICY,
			[taken('ABSENT_UNEXCUSED'), taken('LATE'), taken('ABSENT_EXCUSED')],
			[1, 0.5, 0.5],
		);
		expect(result.participationTotal).toBe(2);
		expect(result.cp).toBe(2);
		expect(result.attendanceScore).toBe(4);
		expect(result.totalScore).toBe(6);
	});

	it('sets CP to 0 and bans the student after more than 2 unexcused absences', () => {
		const result = computeCp(
			DEFAULT_CP_POLICY,
			[taken('ABSENT_UNEXCUSED'), taken('LATE'), blank(), taken('PRESENT')],
			[2],
		);
		expect(result.unexcusedAbsences).toBe(3);
		expect(result.banned).toBe(true);
		expect(result.examEligible).toBe(false);
		expect(result.cp).toBe(2);
		expect(result.attendanceScore).toBe(3.5);
		expect(result.totalScore).toBe(5.5);
		expect(result.riskLevel).toBe('BANNED');
	});

	it('ignores cancelled sessions and sessions that have not been taken', () => {
		const result = computeCp(DEFAULT_CP_POLICY, [
			{ isCancelled: true, attendanceTakenAt: '2026-09-01', status: 'ABSENT_UNEXCUSED' },
			{ isCancelled: false, attendanceTakenAt: null, status: null },
			taken('PRESENT'),
		]);
		expect(result.takenSessions).toBe(1);
		expect(result.unexcusedAbsences).toBe(0);
		expect(result.cp).toBe(0);
		expect(result.attendanceScore).toBe(5);
	});

	it('does not count an open draft week even when marks already exist', () => {
		const result = computeCp(DEFAULT_CP_POLICY, [
			{
				isCancelled: false,
				attendanceTakenAt: null,
				attendanceOpen: true,
				status: 'ABSENT_UNEXCUSED',
			},
			taken('PRESENT'),
		]);
		expect(result.takenSessions).toBe(1);
		expect(result.unexcusedAbsences).toBe(0);
		expect(result.attendanceScore).toBe(5);
	});

	it('does not count a parked draft week after attendance is temporarily locked', () => {
		const result = computeCp(DEFAULT_CP_POLICY, [
			{
				isCancelled: false,
				attendanceTakenAt: null,
				attendanceOpen: false,
				status: 'ABSENT_UNEXCUSED',
			},
			taken('PRESENT'),
		]);
		expect(result.takenSessions).toBe(1);
		expect(result.unexcusedAbsences).toBe(0);
		expect(result.attendanceScore).toBe(5);
	});

	it('counts a finalized week and stops counting it again after it is reopened', () => {
		const finalized = computeCp(DEFAULT_CP_POLICY, [
			{
				isCancelled: false,
				attendanceTakenAt: '2026-09-01T00:00:00.000Z',
				attendanceOpen: false,
				status: 'ABSENT_UNEXCUSED',
			},
		]);
		expect(finalized.takenSessions).toBe(1);
		expect(finalized.unexcusedAbsences).toBe(1);
		expect(finalized.attendanceScore).toBe(4.5);

		const reopened = computeCp(DEFAULT_CP_POLICY, [
			{
				isCancelled: false,
				attendanceTakenAt: '2026-09-01T00:00:00.000Z',
				attendanceOpen: true,
				status: 'ABSENT_UNEXCUSED',
			},
		]);
		expect(reopened.takenSessions).toBe(0);
		expect(reopened.unexcusedAbsences).toBe(0);
		expect(reopened.attendanceScore).toBe(5);
	});
});

describe('sessionsForEnrollment', () => {
	it('does not count sessions before the student joined', () => {
		const weeks = Array.from({ length: 6 }, (_, index) => ({ weekNumber: index + 1 }));
		expect(sessionsForEnrollment(weeks, 4).map((session) => session.weekNumber)).toEqual([4, 5, 6]);
	});

	it('prevents retroactive absences when computing CP for a late join', () => {
		const sessions = [
			{ weekNumber: 1, ...blank() },
			{ weekNumber: 2, ...blank() },
			{ weekNumber: 3, ...taken('PRESENT') },
		];
		const result = computeCp(DEFAULT_CP_POLICY, sessionsForEnrollment(sessions, 3));
		expect(result.takenSessions).toBe(1);
		expect(result.unexcusedAbsences).toBe(0);
		expect(result.cp).toBe(0);
	});
});

describe('defaultEnrolledFromWeek', () => {
	it('starts from the first week that has not been taken', () => {
		expect(
			defaultEnrolledFromWeek(
				[
					{ weekNumber: 1, attendanceTakenAt: '2026-09-01', isCancelled: false },
					{ weekNumber: 2, attendanceTakenAt: '2026-09-08', isCancelled: false },
					{ weekNumber: 3, attendanceTakenAt: null, isCancelled: false },
				],
				10,
			),
		).toBe(3);
	});

	it('skips cancelled sessions and falls past taken weeks', () => {
		expect(
			defaultEnrolledFromWeek(
				[
					{ weekNumber: 1, attendanceTakenAt: '2026-09-01', isCancelled: false },
					{ weekNumber: 2, attendanceTakenAt: null, isCancelled: true },
					{ weekNumber: 3, attendanceTakenAt: '2026-09-15', isCancelled: false },
				],
				3,
			),
		).toBe(4);
	});
});
