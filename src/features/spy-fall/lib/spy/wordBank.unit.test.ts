import { describe, expect, it } from 'vitest';

import { SPY_TAGS, SPY_TOPICS, normalizeExcludedTags } from '@/features/spy-fall/config/spyGame';
import { WORD_BANK_EN } from '@/features/spy-fall/lib/spy/wordBank.en';
import {
	WORD_BANK,
	filterWordPairs,
	pickWordPair,
	resolveWordPairForGame,
	tagsOf,
} from '@/features/spy-fall/lib/spy/wordBank';

describe('word tags', () => {
	it('uses only catalog tags, and every tag has pairs to exclude', () => {
		const known = new Set<string>(SPY_TAGS);
		for (const entry of [...WORD_BANK, ...WORD_BANK_EN]) {
			for (const tag of tagsOf(entry)) expect(known.has(tag)).toBe(true);
		}
		for (const tag of SPY_TAGS) {
			expect(WORD_BANK.some((entry) => tagsOf(entry).includes(tag))).toBe(true);
		}
	});

	it('gives topic-wide tags to every pair of that topic', () => {
		for (const entry of WORD_BANK.filter((e) => e.category === 'người nổi tiếng')) {
			expect(tagsOf(entry)).toContain('real-people');
		}
	});

	it('never draws an excluded tag, even when the topic would allow it', () => {
		const excluded = ['real-people', 'nightlife', 'spooky'];
		for (let i = 0; i < 50; i++) {
			const pair = pickWordPair({ excludedTags: excluded, random: () => i / 50 });
			expect(tagsOf(pair).some((tag) => excluded.includes(tag))).toBe(false);
		}
		expect(filterWordPairs('người nổi tiếng', WORD_BANK, excluded)).toHaveLength(0);
		const fallback = pickWordPair({ topic: 'người nổi tiếng', excludedTags: excluded, random: () => 0 });
		expect(tagsOf(fallback)).not.toContain('real-people');
	});

	it('normalizes excluded tags from untrusted input', () => {
		expect(normalizeExcludedTags(['spooky', 'bogus', 'vietnam', 'spooky', 3])).toEqual([
			'vietnam',
			'spooky',
		]);
		expect(normalizeExcludedTags('spooky')).toEqual([]);
	});
});

describe('WORD_BANK', () => {
	it('has at least 15 Vietnamese pairs in every topic and unique words', () => {
		expect(WORD_BANK.length).toBeGreaterThanOrEqual(100);
		const ids = new Set<string>();
		const words = new Set<string>();
		for (const pair of WORD_BANK) {
			expect(ids.has(pair.id)).toBe(false);
			ids.add(pair.id);
			expect(pair.wordA).not.toBe(pair.wordB);
			expect(words.has(pair.wordA)).toBe(false);
			expect(words.has(pair.wordB)).toBe(false);
			words.add(pair.wordA);
			words.add(pair.wordB);
		}
		for (const topic of SPY_TOPICS) {
			expect(WORD_BANK.filter((pair) => pair.category === topic).length).toBeGreaterThanOrEqual(15);
		}
	});

	it('keeps the English bank smaller, with independent ids', () => {
		expect(WORD_BANK_EN.length).toBeGreaterThanOrEqual(40);
		expect(WORD_BANK_EN.length).toBeLessThan(WORD_BANK.length);
		const viIds = new Set(WORD_BANK.map((pair) => pair.id));
		for (const pair of WORD_BANK_EN) {
			expect(pair.id.startsWith('en-')).toBe(true);
			expect(viIds.has(pair.id)).toBe(false);
			expect(pair.wordA).not.toBe(pair.wordB);
		}
	});
});

describe('pickWordPair', () => {
	it('never leaves the requested topic', () => {
		for (let i = 0; i < 30; i++) {
			const pair = pickWordPair({
				topic: 'nghề nghiệp',
				random: () => (i % 10) / 10,
			});
			expect(pair.category).toBe('nghề nghiệp');
		}
	});

	it('treats an unknown topic as any', () => {
		const pair = pickWordPair({ topic: 'liên tưởng', random: () => 0 });
		expect(WORD_BANK.some((entry) => entry.id === pair.id)).toBe(true);
	});

	it('avoids recent ids, then reuses the same topic when every pair is recent', () => {
		const jobs = WORD_BANK.filter((pair) => pair.category === 'nghề nghiệp');
		const recent = jobs.slice(0, jobs.length - 1).map((pair) => pair.id);
		const fresh = pickWordPair({ topic: 'nghề nghiệp', recentIds: recent, random: () => 0 });
		expect(recent).not.toContain(fresh.id);

		const allRecent = jobs.map((pair) => pair.id);
		const reused = pickWordPair({ topic: 'nghề nghiệp', recentIds: allRecent, random: () => 0 });
		expect(reused.category).toBe('nghề nghiệp');
		expect(allRecent).toContain(reused.id);
	});

	it('assigns either word to civilians', () => {
		const entry = WORD_BANK[0]!;
		expect(resolveWordPairForGame(entry, () => 0.9).civilianWord).toBe(entry.wordA);
		expect(resolveWordPairForGame(entry, () => 0.1).civilianWord).toBe(entry.wordB);
	});
});

describe('filterWordPairs', () => {
	it('returns the whole bank for any or an unknown topic', () => {
		expect(filterWordPairs('any')).toHaveLength(WORD_BANK.length);
		expect(filterWordPairs('liên tưởng')).toHaveLength(WORD_BANK.length);
	});
});
