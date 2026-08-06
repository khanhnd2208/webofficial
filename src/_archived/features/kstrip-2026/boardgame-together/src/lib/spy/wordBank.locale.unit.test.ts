import { describe, expect, it } from 'vitest';

import { WORD_BANK } from '@/lib/spy/wordBank';
import { WORD_BANK_EN } from '@/lib/spy/wordBank.en';
import { pickWordPair } from '@/lib/spy/wordBank';

describe('bilingual word bank', () => {
	it('EN bank mirrors VI bank ids and size', () => {
		expect(WORD_BANK_EN).toHaveLength(WORD_BANK.length);
		const viIds = new Set(WORD_BANK.map((p) => p.id));
		for (const pair of WORD_BANK_EN) {
			expect(viIds.has(pair.id)).toBe(true);
		}
	});

	it('pickWordPair returns English words when locale is en', () => {
		const pair = pickWordPair({ locale: 'en', difficulty: 'easy', random: () => 0 });
		expect(pair.wordA).toMatch(/^[A-Za-z]/);
		expect(WORD_BANK_EN.some((p) => p.id === pair.id)).toBe(true);
	});
});
