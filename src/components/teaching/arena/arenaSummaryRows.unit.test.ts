import { describe, expect, it } from 'vitest';

import type { ArenaHistoryEntry } from './arenaGame';
import { arenaSummaryRows } from './arenaSummaryRows';

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
});
