import { describe, expect, it, vi } from 'vitest';

import {
	pinStudent,
	readStudentIdentity,
	studentIdentitySummary,
	writeStudentIdentity,
} from './studentIdentity';

describe('student identity', () => {
	it('pins the chosen row and leaves an unchosen list untouched', () => {
		const rows = [{ enrollmentId: 'a' }, { enrollmentId: 'b' }, { enrollmentId: 'c' }];
		expect(pinStudent(rows, 'c').map((row) => row.enrollmentId)).toEqual(['c', 'a', 'b']);
		expect(pinStudent(rows, null)).toBe(rows);
	});

	it('describes the chosen student in one line', () => {
		expect(
			studentIdentitySummary(
				{ cp: { unexcusedAbsences: 1, attendanceScore: 4.5, riskLevel: 'OK' } },
				10,
				5,
			),
		).toBe('Bạn: vắng 1/10 · Chuyên cần 4,5/5 · Đủ điều kiện');
	});

	it('keeps working when localStorage throws', () => {
		const storage = {
			getItem: () => {
				throw new Error('blocked');
			},
			setItem: () => {
				throw new Error('blocked');
			},
			removeItem: () => {
				throw new Error('blocked');
			},
		};
		vi.stubGlobal('localStorage', storage);
		expect(readStudentIdentity('lop-1')).toBeNull();
		expect(() => writeStudentIdentity('lop-1', 'enr-1')).not.toThrow();
		expect(() => writeStudentIdentity('lop-1', null)).not.toThrow();
		vi.unstubAllGlobals();
	});
});
