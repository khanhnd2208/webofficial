import { describe, expect, it, vi } from 'vitest';

import {
	isRepeatedClassSummary,
	matchesStudentQuery,
	pinStudent,
	readStudentIdentity,
	studentEligibility,
	studentIdentitySummary,
	writeStudentIdentity,
} from './studentIdentity';

describe('student identity', () => {
	it('pins the chosen row and leaves an unchosen list untouched', () => {
		const rows = [{ enrollmentId: 'a' }, { enrollmentId: 'b' }, { enrollmentId: 'c' }];
		expect(pinStudent(rows, 'c').map((row) => row.enrollmentId)).toEqual(['c', 'a', 'b']);
		expect(pinStudent(rows, null)).toBe(rows);
	});

	it('maps risk levels to Vietnamese eligibility labels', () => {
		expect(studentEligibility('OK')).toBe('Đủ điều kiện');
		expect(studentEligibility('AT_RISK')).toBe('Có nguy cơ');
		expect(studentEligibility('BANNED')).toBe('Cấm thi');
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

	it('matches students by Vietnamese name or the last two digits of the student code', () => {
		const student = { studentCode: '********45', familyName: 'Nguyễn Thị', givenName: 'Đào' };
		expect(matchesStudentQuery(student, '')).toBe(true);
		expect(matchesStudentQuery(student, 'dao')).toBe(true);
		expect(matchesStudentQuery(student, 'nguyen thi')).toBe(true);
		expect(matchesStudentQuery(student, '45')).toBe(true);
		expect(matchesStudentQuery(student, '2406090045')).toBe(true);
		expect(matchesStudentQuery(student, '99')).toBe(false);
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

describe('isRepeatedClassSummary', () => {
	const board = {
		courseCode: '61MGT3HRM',
		groupNo: '39-01',
		term: 'HỌC KỲ 1 - NĂM HỌC 2026 - 2027',
	};
	it('treats the summary filled in on sharing as a repeat of the header', () => {
		expect(
			isRepeatedClassSummary('61MGT3HRM · Nhóm 39-01 · HỌC KỲ 1 - NĂM HỌC 2026 - 2027', board),
		).toBe(true);
		expect(isRepeatedClassSummary('  nhóm   39-01 ', board)).toBe(true);
	});
	it('keeps a summary the lecturer actually wrote', () => {
		expect(isRepeatedClassSummary('Lớp học thứ Ba, phòng A2', board)).toBe(false);
		expect(isRepeatedClassSummary('', board)).toBe(false);
	});
});
