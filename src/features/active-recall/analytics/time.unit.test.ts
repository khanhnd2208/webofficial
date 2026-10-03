import { describe, expect, it } from 'vitest';
import { heartbeatRecallSchema } from './contracts';
import { recallDay, recallDays, recallReportFilters, splitRecallSeconds } from './time';
describe('Recall reporting time', () => {
	it('uses Vietnam dates and splits a midnight interval without losing seconds', () => {
		expect(recallDay(new Date('2026-10-02T17:00:00Z'))).toBe('2026-10-03');
		expect(splitRecallSeconds(new Date('2026-10-02T17:00:20Z'), 60)).toEqual([
			{ day: '2026-10-02', seconds: 40 },
			{ day: '2026-10-03', seconds: 20 },
		]);
		expect(
			splitRecallSeconds(new Date('2026-10-02T17:00:00.500Z'), 1).reduce(
				(s, r) => s + r.seconds,
				0,
			),
		).toBe(1);
	});
	it('includes the last day and zero-activity dates in a default 30-day range', () => {
		const f = recallReportFilters({}, new Date('2026-10-03T01:00:00Z'));
		expect(f).toMatchObject({ start: '2026-09-04', end: '2026-10-03', page: 1 });
		expect(recallDays(f.start, f.end)).toHaveLength(30);
	});
	it('rejects impossible/reversed/overlong dates and bounds pagination', () => {
		for (const q of [
			{ start: '2026-02-30' },
			{ start: '2026-10-04', end: '2026-10-03' },
			{ start: '2024-01-01', end: '2026-01-01' },
		])
			expect(() => recallReportFilters(q)).toThrow();
		expect(recallReportFilters({ page: '-1', historyPage: '999999' })).toMatchObject({
			page: 1,
			historyPage: 100000,
		});
	});
	it('rejects inflated time and impossible reveal counters', () => {
		expect(heartbeatRecallSchema.safeParse({ seconds: 76 }).success).toBe(false);
	});
});
