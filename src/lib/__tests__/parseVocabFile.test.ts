/* ════════════════════════════════════════════════════════════════════════
   parseVocabFile.test.ts
   Unit tests for the vocabulary file parsing utility.
   Uses vitest. No database or external service required.
   ════════════════════════════════════════════════════════════════════════ */
import { describe, it, expect } from 'vitest';
import { parseVocabRows, mapRow } from '@/lib/vocab/parseVocabFile';

// ── mapRow ─────────────────────────────────────────────────────────────────────
describe('mapRow', () => {
	it('maps standard column names correctly', () => {
		const result = mapRow({
			word: 'resilient',
			definition: '(adj) có khả năng phục hồi',
			ndk_explanation: 'Khả năng trở lại trạng thái ban đầu',
			partOfSpeech: 'adjective',
			example: 'She is resilient.',
			hints_hard: 'gợi ý khó',
			hints_medium: 'gợi ý vừa',
			hints_easy: 'gợi ý dễ',
		});
		expect(result.term).toBe('resilient');
		expect(result.definition).toBe('(adj) có khả năng phục hồi');
		expect(result.ndkExplanation).toBe('Khả năng trở lại trạng thái ban đầu');
		expect(result.partOfSpeech).toBe('adjective');
		expect(result.hintsHard).toEqual(['gợi ý khó']);
		expect(result._missing).toHaveLength(0);
	});

	it('accepts "term" as alias for "word"', () => {
		const result = mapRow({
			term: 'ambiguous',
			definition: 'mơ hồ',
			ndk_explanation: 'giải thích NDK',
		});
		expect(result.term).toBe('ambiguous');
		expect(result._missing).toHaveLength(0);
	});

	it('parses multi-value hints split by ||', () => {
		const result = mapRow({
			word: 'test',
			definition: 'def',
			ndk_explanation: 'ndk',
			hints_easy: 'gợi ý 1 || gợi ý 2 || gợi ý 3',
		});
		expect(result.hintsEasy).toEqual(['gợi ý 1', 'gợi ý 2', 'gợi ý 3']);
	});

	it('reports missing word/term', () => {
		const result = mapRow({ definition: 'def', ndk_explanation: 'ndk' });
		expect(result._missing).toContain('word/term');
	});

	it('reports missing definition', () => {
		const result = mapRow({ word: 'test', ndk_explanation: 'ndk' });
		expect(result._missing).toContain('definition');
	});

	it('reports missing ndk_explanation', () => {
		const result = mapRow({ word: 'test', definition: 'def' });
		expect(result._missing).toContain('ndk_explanation');
	});

	it('trims whitespace from all fields', () => {
		const result = mapRow({
			word: '  resilient  ',
			definition: '  có khả năng phục hồi  ',
			ndk_explanation: '  giải thích  ',
		});
		expect(result.term).toBe('resilient');
		expect(result.ndkExplanation).toBe('giải thích');
	});
});

// ── parseVocabRows ─────────────────────────────────────────────────────────────
describe('parseVocabRows', () => {
	it('returns parsed words for valid rows', () => {
		const rows = [
			{ word: 'resilient', definition: 'phục hồi', ndk_explanation: 'giải thích' },
			{ word: 'ambiguous', definition: 'mơ hồ', ndk_explanation: 'giải thích 2' },
		];
		const { words, errors } = parseVocabRows(rows);
		expect(words).toHaveLength(2);
		expect(errors).toHaveLength(0);
	});

	it('collects errors for rows missing ndk_explanation', () => {
		const rows: Record<string, string>[] = [
			{ word: 'resilient', definition: 'phục hồi' }, // no ndk_explanation
			{ word: 'ok', definition: 'def', ndk_explanation: 'ndk' },
		];
		const { words, errors } = parseVocabRows(rows);
		expect(words).toHaveLength(1);
		expect(errors).toHaveLength(1);
		expect(errors[0].row).toBe(2); // header=1, first data row=2
		expect(errors[0].missing).toContain('ndk_explanation');
	});

	it('collects errors for rows missing term', () => {
		const rows: Record<string, string>[] = [
			{ definition: 'phục hồi', ndk_explanation: 'giải thích' }, // no word
		];
		const { errors } = parseVocabRows(rows);
		expect(errors[0].missing).toContain('word/term');
	});

	it('silently skips completely blank rows', () => {
		const rows = [
			{ word: '', definition: '', ndk_explanation: '' },
			{ word: 'ok', definition: 'def', ndk_explanation: 'ndk' },
		];
		const { words, errors } = parseVocabRows(rows);
		expect(words).toHaveLength(1);
		expect(errors).toHaveLength(0);
	});

	it('assigns correct 1-based row numbers in errors (row 1 = header)', () => {
		const rows: Record<string, string>[] = [
			{ word: 'ok', definition: 'def', ndk_explanation: 'ndk' },       // row 2 → ok
			{ word: 'bad', definition: 'def' },                               // row 3 → error
			{ word: 'ok2', definition: 'def2', ndk_explanation: 'ndk2' },    // row 4 → ok
			{ word: '', definition: 'def', ndk_explanation: 'ndk' },         // row 5 → error (missing term)
		];
		const { errors } = parseVocabRows(rows);
		expect(errors.map((e) => e.row)).toEqual([3, 5]);
	});

	it('handles Vietnamese characters correctly', () => {
		const rows = [
			{
				word: 'bền bỉ',
				definition: '(adj) kiên trì, không bỏ cuộc',
				ndk_explanation: 'Người hoặc vật có thể chịu đựng khó khăn lâu dài',
				partOfSpeech: 'tính từ',
				example: 'Cô ấy rất bền bỉ.',
			},
		];
		const { words, errors } = parseVocabRows(rows);
		expect(errors).toHaveLength(0);
		expect(words[0].term).toBe('bền bỉ');
		expect(words[0].ndkExplanation).toBe('Người hoặc vật có thể chịu đựng khó khăn lâu dài');
	});

	it('returns empty words and errors for empty input', () => {
		const { words, errors } = parseVocabRows([]);
		expect(words).toHaveLength(0);
		expect(errors).toHaveLength(0);
	});
});
