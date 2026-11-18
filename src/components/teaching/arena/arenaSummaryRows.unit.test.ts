import { describe, expect, it } from 'vitest';

import type { ArenaHistoryEntry } from './arenaGame';
import {
	arenaSummaryRows,
	arenaSummaryText,
	arenaSummaryTotals,
	summaryOutcome,
} from './arenaSummaryRows';

const turn = (enrollmentId: string, result: ArenaHistoryEntry['result'], extra = {}) =>
	({
		id: `${enrollmentId}-${result}`,
		at: 0,
		enrollmentId,
		name: enrollmentId,
		cardId: null,
		result,
		...extra,
	}) as ArenaHistoryEntry;

describe('arenaSummaryRows', () => {
	it('lists passes by award, then misses, then students not called', () => {
		const rows = arenaSummaryRows(
			[{ enrollmentId: 'a' }, { enrollmentId: 'b' }, { enrollmentId: 'c' }, { enrollmentId: 'd' }],
			[
				turn('d', 'skip'),
				turn('b', 'pass', { award: 1, cpAfter: 1 }),
				turn('c', 'fail', { giftAfter: 2 }),
				turn('left', 'pass', { award: 2, cpAfter: 2 }),
			],
			(id, fallback) => fallback || id,
		);
		expect(rows.map((row) => [row.enrollmentId, row.result, row.award])).toEqual([
			['left', 'pass', 2],
			['b', 'pass', 1],
			['c', 'fail', null],
			['a', 'waiting', null],
			['d', 'waiting', null],
		]);
		expect(rows[2]!.giftAfter).toBe(2);
	});

	it('shows what each student gained, kept or was given', () => {
		const rows = arenaSummaryRows(
			[{ enrollmentId: 'a' }],
			[
				turn('raised', 'pass', { award: 2, cpBefore: 0.5, cpAfter: 2 }),
				turn('kept', 'pass', { award: 1, cpBefore: 2, cpAfter: 2 }),
				turn('bare', 'pass', { award: 0, cpBefore: 1, cpAfter: 1 }),
				turn('missed', 'fail', { giftAfter: 3 }),
				turn('arena-manual:x', 'pass', {}),
			],
			(id, fallback) => fallback || id,
		);
		const byId = new Map(rows.map((row) => [row.enrollmentId, row]));
		expect(byId.get('raised')!.cpGain).toBe(1.5);
		expect(summaryOutcome(byId.get('raised')!)).toBe('Đạt · CP 0.5 → 2 (+1.5)');
		expect(summaryOutcome(byId.get('kept')!)).toMatch(/CP giữ 2/);
		expect(summaryOutcome(byId.get('bare')!)).toBe('Không điểm · CP giữ nguyên');
		expect(summaryOutcome(byId.get('missed')!)).toBe('Chưa đạt · +1 Gift (tổng 3)');
		expect(summaryOutcome(byId.get('arena-manual:x')!)).toBe('Đạt · không ghi điểm');

		const totals = arenaSummaryTotals(rows);
		expect(totals).toMatchObject({
			answered: 5,
			passed: 4,
			failed: 1,
			cpGained: 1.5,
			cpRaised: 1,
			giftsAdded: 1,
		});
		const text = arenaSummaryText('HRM · 2026-11-10', rows, totals);
		expect(text).toContain('CP cộng: +1.5 (1 bạn) · Gift: +1');
		expect(text).toContain('Chưa gọi: a');
	});

	it('keeps a miss when the student later answers in place of a classmate', () => {
		const rows = arenaSummaryRows(
			[{ enrollmentId: 'a' }, { enrollmentId: 'b' }, { enrollmentId: 'c' }],
			[
				turn('a', 'fail', { at: 1, giftAfter: 1 }),
				turn('b', 'fail', { at: 2, giftAfter: 1 }),
				// a answers b's question, c answers a's: neither was called for it.
				turn('a', 'pass', { id: 'assist:1', at: 3, award: 1, cpBefore: 0, cpAfter: 1 }),
				turn('c', 'pass', { id: 'assist:2', at: 4, award: 2, cpBefore: 0, cpAfter: 2 }),
			],
			(id, fallback) => fallback || id,
		);
		const byId = new Map(rows.map((row) => [row.enrollmentId, row]));
		expect(byId.get('a')).toMatchObject({ result: 'fail', giftAdded: 1, assists: 1, cpGain: 1 });
		expect(byId.get('c')).toMatchObject({ result: 'waiting', assists: 1, cpGain: 2 });
		expect(summaryOutcome(byId.get('a')!)).toBe(
			'Chưa đạt · +1 Gift (tổng 1) · trả lời thay 1 câu, CP 0 → 1 (+1)',
		);
		expect(summaryOutcome(byId.get('c')!)).toBe('Chưa gọi · trả lời thay 1 câu, CP 0 → 2 (+2)');

		const totals = arenaSummaryTotals(rows);
		expect(totals).toMatchObject({
			answered: 2,
			passed: 0,
			failed: 2,
			cpGained: 3,
			cpRaised: 2,
			giftsAdded: 2,
		});
		const text = arenaSummaryText('HRM', rows, totals);
		expect(text).toContain('Đã trả lời 2/3');
		expect(text).toContain('Chưa gọi: c');
	});

	it('adds an assist to the CP of a student who passed their own turn', () => {
		const [row] = arenaSummaryRows(
			[{ enrollmentId: 'a' }],
			[
				turn('a', 'pass', { at: 1, award: 0.5, cpBefore: 0, cpAfter: 0.5 }),
				turn('a', 'pass', { id: 'assist:1', at: 2, award: 2, cpBefore: 0.5, cpAfter: 2 }),
			],
			(id) => id,
		);
		expect(row).toMatchObject({ result: 'pass', award: 0.5, cpBefore: 0, cpAfter: 2, cpGain: 2 });
		expect(summaryOutcome(row!)).toBe('Đạt · CP 0 → 2 (+2) · trả lời thay 1 câu');
	});
});
