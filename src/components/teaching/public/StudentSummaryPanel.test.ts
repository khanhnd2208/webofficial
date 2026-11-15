import { describe, expect, it } from 'vitest';

import type { TeachingSessionRecord } from '@/features/teaching/types';

import { getPublicSummaryLockStatus } from './StudentSummaryPanel';

function session(week: number, overrides: Partial<TeachingSessionRecord> = {}): TeachingSessionRecord {
	return {
		id: `s-${week}-${overrides.id ?? 'a'}`,
		classId: 'class-1',
		tutorialClassId: null,
		weekNumber: week,
		heldOn: null,
		topic: '',
		method: 'ROLL_CALL',
		isCancelled: false,
		attendanceTakenAt: '2026-09-01T00:00:00.000Z',
		attendanceOpen: false,
		participationTakenAt: '2026-09-01T00:00:00.000Z',
		participationOpen: false,
		...overrides,
	} as TeachingSessionRecord;
}

describe('getPublicSummaryLockStatus', () => {
	it('does not let a cancelled session hold its week open', () => {
		const sessions = [1, 2, 3].map((week) => session(week));
		sessions.push(session(2, { id: 'cancelled', isCancelled: true, attendanceTakenAt: null }));
		expect(getPublicSummaryLockStatus(sessions, 3)).toMatchObject({
			lockedAttendanceWeeks: 3,
			lockedCpWeeks: 3,
			unlocked: true,
		});
	});

	it('counts a fully cancelled week as settled but a week without sessions as open', () => {
		const cancelledWeek = [
			session(1),
			session(2, { isCancelled: true, attendanceTakenAt: null, participationTakenAt: null }),
		];
		expect(getPublicSummaryLockStatus(cancelledWeek, 2).unlocked).toBe(true);
		expect(getPublicSummaryLockStatus([session(1)], 2)).toMatchObject({
			lockedAttendanceWeeks: 1,
			unlocked: false,
		});
	});
});
