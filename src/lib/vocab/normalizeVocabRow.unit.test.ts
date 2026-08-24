import { describe, expect, it } from 'vitest';

import { normalizeVocabRow } from './normalizeVocabRow';

describe('normalizeVocabRow', () => {
	it('accepts legacy store columns as the unified contract', () => {
		const row = normalizeVocabRow({
			word: 'resilient',
			definition: 'phục hồi',
			ndk_explanation: 'giải thích',
		});
		expect(row._missing).toHaveLength(0);
		expect(row.term).toBe('resilient');
		expect(row.meaningVi).toBe('phục hồi');
		expect(row.definition).toBe('phục hồi');
		expect(row.ndkExplanation).toBe('giải thích');
	});

	it('accepts bilingual My Class columns without ndk_explanation', () => {
		const row = normalizeVocabRow({
			term: 'scope',
			meaning_en: 'the extent of something',
			meaning_vi: 'phạm vi',
		});
		expect(row._missing).toHaveLength(0);
		expect(row.meaningEn).toBe('the extent of something');
		expect(row.definition).toBe('phạm vi');
	});
});
