import { describe, expect, it } from 'vitest';

import { parseTestQuestionCsv, allocateQuestionSlugs } from './testQuestions';

const HEADER =
	'stem,option_a,option_b,option_c,option_d,correct_option,explanation,difficulty,level';

describe('parseTestQuestionCsv', () => {
	it('parses a standard row and applies defaults', () => {
		const [row] = parseTestQuestionCsv(`${HEADER}\nCâu hỏi mẫu,Đúng,Sai,Nhiễu,,B,Giải thích,,`);
		expect(row).toMatchObject({
			stem: 'Câu hỏi mẫu',
			explanation: 'Giải thích',
			difficulty: 2,
			errors: [],
		});
		expect(row?.answer).toEqual({ type: 'MCQ_SINGLE', correctKey: 'B' });
		expect(row?.options).toHaveLength(3);
		expect(row?.slug).toBe('cau-hoi-mau');
	});

	it('accepts Vietnamese header aliases', () => {
		const csv =
			'Câu hỏi,A,B,Đáp án,Giải thích,Độ khó,Mức độ\nHRM là gì?,Đúng,Sai,A,Ổn,2,FOUNDATION';
		const [row] = parseTestQuestionCsv(csv);
		expect(row?.errors).toEqual([]);
		expect(row?.stem).toBe('HRM là gì?');
		expect(row?.answer).toEqual({ type: 'MCQ_SINGLE', correctKey: 'A' });
		expect(row?.difficulty).toBe(2);
	});

	it('detects semicolon and tab delimiters', () => {
		const semi = parseTestQuestionCsv('stem;option_a;option_b;correct_option\nQ1;Yes;No;A');
		const tab = parseTestQuestionCsv('stem\toption_a\toption_b\tcorrect_option\nQ1\tYes\tNo\tA');
		expect(semi[0]?.errors).toEqual([]);
		expect(tab[0]?.errors).toEqual([]);
		expect(semi[0]?.stem).toBe('Q1');
		expect(tab[0]?.stem).toBe('Q1');
	});

	it('flags a missing stem', () => {
		const [row] = parseTestQuestionCsv(`${HEADER}\n,Yes,No,,,A,,,`);
		expect(row?.errors).toContain('Thiếu stem');
	});

	it('flags an invalid or unmatched correct_option', () => {
		const missing = parseTestQuestionCsv(`${HEADER}\nQ,Yes,No,,,Z,,,`);
		const unmatched = parseTestQuestionCsv(`${HEADER}\nQ,Yes,No,,,E,,,`);
		expect(missing[0]?.errors).toContain('correct_option không hợp lệ');
		expect(unmatched[0]?.errors).toContain('correct_option không hợp lệ');
	});

	it('flags fewer than two options', () => {
		const [row] = parseTestQuestionCsv(`${HEADER}\nQ,Only,,,,A,,,`);
		expect(row?.errors).toContain('Cần từ 2 đến 6 đáp án');
	});

	it('allocates unique slugs for duplicate stems', () => {
		const rows = parseTestQuestionCsv(
			`${HEADER}\nSame stem,Yes,No,,,A,,,\nSame stem,Yes,No,,,B,,,`,
		);
		expect(rows.map((row) => row.slug)).toEqual(['same-stem', 'same-stem-2']);
		expect(allocateQuestionSlugs(['Hello', 'Hello'], ['hello'])).toEqual(['hello-2', 'hello-3']);
	});
});
