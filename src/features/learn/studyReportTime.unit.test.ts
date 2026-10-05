import { describe, expect, it } from 'vitest';
import { fillStudyDays, studyReportPage, studyReportRange } from './studyReportTime';

describe('study report calendar and paging', () => {
	it('starts a new calendar day at Vietnam midnight, independently of host timezone', () => {
		const before = studyReportRange(7, new Date('2026-09-26T16:59:59Z'));
		const after = studyReportRange(7, new Date('2026-09-26T17:00:00Z'));
		expect(before.start.toISOString()).toBe('2026-09-19T17:00:00.000Z');
		expect(after.start.toISOString()).toBe('2026-09-20T17:00:00.000Z');
	});
	it('fills empty days across a month boundary without changing existing totals', () => {
		const { startDay, rangeDays } = studyReportRange(3, new Date('2026-10-01T10:00:00Z'));
		const rows = fillStudyDays(startDay, rangeDays, [{ day: '2026-09-30', seconds: 75 }], {
			seconds: 0,
		});
		expect(rows).toEqual([
			{ day: '2026-09-29', seconds: 0 },
			{ day: '2026-09-30', seconds: 75 },
			{ day: '2026-10-01', seconds: 0 },
		]);
	});
	it('bounds nonfinite, negative and oversized input', () => {
		expect(studyReportRange(NaN).rangeDays).toBe(30);
		expect(studyReportRange(0).rangeDays).toBe(1);
		expect(studyReportRange(1000).rangeDays).toBe(365);
		expect(studyReportPage(NaN)).toBe(1);
		expect(studyReportPage(-1)).toBe(1);
		expect(studyReportPage(2.9)).toBe(2);
		expect(studyReportPage(1e9)).toBe(100_000);
	});
});
