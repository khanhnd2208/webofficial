import { describe, expect, it } from 'vitest';

import type { TeachingSessionRecord } from '@/features/teaching/types';

import type { BoardGridStudent } from '../board/gridTypes';
import { pointsGlyph, rosterCells, rosterWeeks } from './classRosterModel';

function session(week: number, patch: Partial<TeachingSessionRecord> = {}): TeachingSessionRecord {
	return {
		id: `s${week}`,
		classId: 'c',
		tutorialClassId: 't',
		weekNumber: week,
		heldOn: '2026-09-01',
		topic: '',
		method: 'ROLL_CALL',
		isCancelled: false,
		attendanceTakenAt: '2026-09-01T00:00:00.000Z',
		attendanceOpen: false,
		participationTakenAt: '2026-09-01T00:00:00.000Z',
		participationOpen: false,
		...patch,
	};
}

const student = {
	enrollmentId: 'e1',
	orderNo: 1,
	tutorialClassId: 't',
	enrolledFromWeek: 2,
	studentCode: '********45',
	familyName: 'Nguyễn',
	givenName: 'An',
	marks: { s3: { status: 'ABSENT_UNEXCUSED', note: 'Ốm' } },
	participation: { s3: { points: 0.5, note: '' } },
	cp: {} as BoardGridStudent['cp'],
} as BoardGridStudent;

describe('rosterCells', () => {
	const sessions = [session(1), session(3), session(4, { isCancelled: true }), session(5, { attendanceTakenAt: null, attendanceOpen: false, participationTakenAt: null })];
	const weeks = rosterWeeks(sessions, 6);

	it('tells real marks apart from weeks that have nothing to show', () => {
		const kinds = rosterCells(student, weeks, 'attendance').map((cell) => cell.kind);
		expect(kinds).toEqual(['not-enrolled', 'none', 'status', 'cancelled', 'pending', 'none']);
	});

	it('labels the week without any note and marks finalised weeks', () => {
		const cell = rosterCells(student, weeks, 'attendance')[2]!;
		expect(cell.label).toBe('Tuần 3: Vắng');
		expect(cell.final).toBe(true);
	});

	it('reads CP points only once grading has started', () => {
		const cells = rosterCells(student, weeks, 'cp');
		expect(cells[2]).toMatchObject({ kind: 'points', points: 0.5 });
		expect(cells[4]).toMatchObject({ kind: 'pending', label: 'Tuần 5: Chưa chấm CP' });
	});
});

describe('pointsGlyph', () => {
	it('keeps CP values short enough for a strip cell', () => {
		expect(pointsGlyph(0)).toBe('0');
		expect(pointsGlyph(0.5)).toBe(',5');
		expect(pointsGlyph(1)).toBe('1');
		expect(pointsGlyph(1.5)).toBe('1,5');
		expect(pointsGlyph(2)).toBe('2');
	});
});
