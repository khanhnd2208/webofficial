import { describe, expect, it } from 'vitest';

import {
	accessModeFromDateOfBirth,
	normalizeStudentCode,
	parseCalendarDate,
	parseDateOfBirth,
	passwordFromDateOfBirth,
} from './studentIdentity';

describe('student identity', () => {
	it('normalizes student codes across case and whitespace', () => {
		expect(normalizeStudentCode(' sv01 ')).toBe('SV01');
		expect(normalizeStudentCode('Sv01')).toBe('SV01');
	});

	it('builds a timezone-independent ddmmyyyy password', () => {
		expect(passwordFromDateOfBirth('2006-09-05')).toBe('05092006');
		expect(passwordFromDateOfBirth(new Date('2006-09-05T00:00:00.000Z'))).toBe('05092006');
		expect(passwordFromDateOfBirth(null)).toBeNull();
	});

	it('keeps day and month zero-padded', () => {
		expect(passwordFromDateOfBirth('2005-01-03')).toBe('03012005');
	});

	it('treats missing date of birth as open access', () => {
		expect(accessModeFromDateOfBirth(null)).toBe('OPEN');
		expect(accessModeFromDateOfBirth('2006-09-05')).toBe('DOB_PASSWORD');
	});

	it('parses both date formats and compact attendance-style values', () => {
		expect(parseCalendarDate('05/09/2006').iso).toBe('2006-09-05');
		expect(parseCalendarDate('2006-09-05').iso).toBe('2006-09-05');
		expect(parseCalendarDate('05092026').iso).toBe('2026-09-05');
		expect(parseCalendarDate('05/09/2026').iso).toBe('2026-09-05');
	});

	it('rejects non-calendar dates and future dates of birth', () => {
		expect(parseCalendarDate('31/02/2006').error).toMatch(/không tồn tại/);
		expect(parseCalendarDate('29/02/2005').error).toMatch(/không tồn tại/);
		expect(parseCalendarDate('29/02/2004').iso).toBe('2004-02-29');
		expect(parseDateOfBirth('05/09/2099', new Date('2026-09-02T00:00:00.000Z')).error).toMatch(
			/tương lai/,
		);
		expect(parseDateOfBirth('', new Date('2026-09-02T00:00:00.000Z')).iso).toBeNull();
	});
});
