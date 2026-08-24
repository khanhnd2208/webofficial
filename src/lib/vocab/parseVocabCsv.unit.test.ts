import { describe, expect, it } from 'vitest';

import { canonicalVocabHeader, parseVocabCsv } from './parseVocabCsv';

describe('canonicalVocabHeader', () => {
	it('maps Vietnamese aliases', () => {
		expect(canonicalVocabHeader('Từ')).toBe('term');
		expect(canonicalVocabHeader('phiên âm')).toBe('pronunciation');
		expect(canonicalVocabHeader('loại từ')).toBe('part_of_speech');
		expect(canonicalVocabHeader('Nghĩa tiếng Anh')).toBe('meaning_en');
		expect(canonicalVocabHeader('nghĩa tiếng việt')).toBe('meaning_vi');
		expect(canonicalVocabHeader('giải thích')).toBe('explanation');
		expect(canonicalVocabHeader('ví dụ')).toBe('example');
	});
});

describe('parseVocabCsv', () => {
	it('parses canonical headers and hints', () => {
		const csv = `term,pronunciation,part_of_speech,meaning_en,meaning_vi,explanation,example,hints_hard,hints_medium,hints_easy
resilient,/rɪˈzɪliənt/,adjective,able to recover,phục hồi,giải thích chuyên ngành,She is resilient.,hard||also hard,medium,easy`;
		const result = parseVocabCsv(csv);
		expect(result.errors).toHaveLength(0);
		expect(result.wordCount).toBe(1);
		expect(result.words[0]).toMatchObject({
			term: 'resilient',
			pronunciation: '/rɪˈzɪliənt/',
			partOfSpeech: 'adjective',
			meaningEn: 'able to recover',
			meaningVi: 'phục hồi',
			ndkExplanation: 'giải thích chuyên ngành',
			hintsHard: ['hard', 'also hard'],
		});
	});

	it('accepts Vietnamese headers and semicolon delimiter', () => {
		const csv = `Từ;Phiên âm;Loại từ;Nghĩa tiếng Anh;Nghĩa tiếng Việt
scope;/skəʊp/;noun;the extent of something;phạm vi`;
		const result = parseVocabCsv(csv);
		expect(result.errors).toHaveLength(0);
		expect(result.words[0].term).toBe('scope');
		expect(result.words[0].meaningVi).toBe('phạm vi');
	});

	it('requires term and at least one meaning', () => {
		const csv = `term,meaning_en,meaning_vi
,english,
widget,,`;
		const result = parseVocabCsv(csv);
		expect(result.wordCount).toBe(0);
		expect(result.errors).toHaveLength(2);
		expect(result.errors[0].missing).toContain('term');
		expect(result.errors[1].missing).toContain('meaning_vi/meaning_en');
	});

	it('allows meaning_en without meaning_vi', () => {
		const csv = `term,meaning_en
stakeholder,a person with an interest in a project`;
		const result = parseVocabCsv(csv);
		expect(result.errors).toHaveLength(0);
		expect(result.words[0].meaningEn).toBe('a person with an interest in a project');
		expect(result.words[0].definition).toBe('a person with an interest in a project');
	});
});
