import { describe, expect, it } from 'vitest';

import {
	WORD_BANK,
	filterWordPairs,
	pickWordPair,
	resolveWordPairForGame,
} from '@/lib/spy/wordBank';

describe('WORD_BANK', () => {
	it('has 60 pairs with balanced difficulty tiers', () => {
		expect(WORD_BANK).toHaveLength(60);
		expect(WORD_BANK.filter((p) => p.difficulty === 'easy')).toHaveLength(20);
		expect(WORD_BANK.filter((p) => p.difficulty === 'standard')).toHaveLength(20);
		expect(WORD_BANK.filter((p) => p.difficulty === 'hard')).toHaveLength(20);
	});
});

describe('filterWordPairs', () => {
	it('filters by category only', () => {
		const result = filterWordPairs('đồ vật');
		expect(result.length).toBeGreaterThan(0);
		expect(result.every((p) => p.category === 'đồ vật')).toBe(true);
	});

	it('filters by difficulty only', () => {
		const result = filterWordPairs(undefined, 'easy');
		expect(result.length).toBeGreaterThan(0);
		expect(result.every((p) => p.difficulty === 'easy')).toBe(true);
	});

	it('filters by category and difficulty combined', () => {
		const result = filterWordPairs('liên tưởng', 'hard');
		expect(result.length).toBeGreaterThan(0);
		expect(result.every((p) => p.category === 'liên tưởng' && p.difficulty === 'hard')).toBe(
			true,
		);
	});

	it('returns all tiers when difficulty is mixed', () => {
		const result = filterWordPairs(undefined, 'mixed');
		expect(result).toHaveLength(60);
	});

	it('returns empty when no match', () => {
		const result = filterWordPairs('chủ đề không tồn tại', 'easy');
		expect(result).toHaveLength(0);
	});
});

describe('resolveWordPairForGame', () => {
	const entry = WORD_BANK[0]!;

	it('assigns wordA to civilian when random >= 0.5', () => {
		const resolved = resolveWordPairForGame(entry, () => 0.9);
		expect(resolved.civilianWord).toBe(entry.wordA);
		expect(resolved.spyWord).toBe(entry.wordB);
		expect(resolved.topic).toBe(entry.category);
	});

	it('swaps words when random < 0.5', () => {
		const resolved = resolveWordPairForGame(entry, () => 0.1);
		expect(resolved.civilianWord).toBe(entry.wordB);
		expect(resolved.spyWord).toBe(entry.wordA);
	});
});

describe('pickWordPair', () => {
	it('returns a valid entry from WORD_BANK', () => {
		const pair = pickWordPair({ random: () => 0 });
		expect(WORD_BANK.some((p) => p.id === pair.id)).toBe(true);
		expect(pair.wordA).toBeTruthy();
		expect(pair.wordB).toBeTruthy();
	});

	it('avoids IDs in recentIds', () => {
		const easyIds = WORD_BANK.filter((p) => p.difficulty === 'easy').map((p) => p.id);
		const recentIds = easyIds.slice(0, easyIds.length - 1);
		const pair = pickWordPair({ difficulty: 'easy', recentIds, random: () => 0 });
		expect(recentIds).not.toContain(pair.id);
		expect(pair.id).toBe(easyIds[easyIds.length - 1]);
	});

	it('falls back to full bank when all recent-filtered', () => {
		const allIds = WORD_BANK.map((p) => p.id);
		const pair = pickWordPair({ recentIds: allIds, random: () => 0 });
		expect(WORD_BANK.some((p) => p.id === pair.id)).toBe(true);
	});

	it('falls back to difficulty-only when category has no matches', () => {
		const pair = pickWordPair({
			topic: 'chủ đề không tồn tại',
			difficulty: 'easy',
			random: () => 0,
		});
		expect(pair.difficulty).toBe('easy');
	});

	it('uses weighted difficulty when mixed', () => {
		const pair = pickWordPair({ difficulty: 'mixed', random: () => 0.1 });
		expect(pair.difficulty).toBe('easy');
	});
});
