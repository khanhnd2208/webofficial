import { describe, expect, it } from 'vitest';

import { compareTeachingClasses } from './displayOrder';

function teachingClass(classCode: string, term = 'HỌC KỲ 1 - NĂM HỌC 2026 - 2027') {
	return { classCode, groupNo: classCode, courseCode: '61MGT3HRM', term };
}

describe('compareTeachingClasses', () => {
	it('orders class codes naturally inside the same course and term', () => {
		const rows = [teachingClass('39-10'), teachingClass('39-2'), teachingClass('39-01')];

		expect(rows.sort(compareTeachingClasses).map((row) => row.classCode)).toEqual([
			'39-01',
			'39-2',
			'39-10',
		]);
	});

	it('keeps newer academic terms ahead of older terms', () => {
		const rows = [
			teachingClass('01', 'HỌC KỲ 2 - NĂM HỌC 2025 - 2026'),
			teachingClass('02', 'HỌC KỲ 1 - NĂM HỌC 2026 - 2027'),
		];

		expect(rows.sort(compareTeachingClasses)[0]?.classCode).toBe('02');
	});
});
