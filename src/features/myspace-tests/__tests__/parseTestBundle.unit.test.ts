import { describe, expect, it } from 'vitest';

import {
	parseTestBundleCsvText,
	parseTestBundleRows,
	SAMPLE_SMART_QUESTIONS_CSV,
	SAMPLE_TEST_BUNDLE_CSV,
} from '../parseTestBundleCsv';
import { buildCsvFixPrompt, buildTestBundlePrompt } from '../prompts/testBundlePrompt';

const HEADER = 'test_title,subject,topic,stem,option_a,option_b,option_c,option_d,correct_option';

function row(overrides: Partial<Record<string, string>> = {}): Record<string, string> {
	return {
		test_title: 'Sample Quiz',
		subject: 'Principles of Management',
		topic: 'Chapter 1',
		stem: 'A question?',
		option_a: 'A',
		option_b: 'B',
		option_c: 'C',
		option_d: 'D',
		correct_option: 'B',
		...overrides,
	};
}

describe('parseTestBundleRows', () => {
	it('parses a valid bundle', () => {
		const result = parseTestBundleRows([row(), row({ stem: 'Second?' })]);
		expect(result.metaErrors).toEqual([]);
		expect(result.errors).toEqual([]);
		expect(result.meta).toMatchObject({
			title: 'Sample Quiz',
			subject: 'Principles of Management',
			status: 'PUBLISHED',
			questionCount: null,
		});
		expect(result.questions).toHaveLength(2);
	});

	it('requires test_title when requireMeta', () => {
		const result = parseTestBundleRows([row({ test_title: '' })]);
		expect(result.meta).toBeNull();
		expect(result.metaErrors.some((e) => /test_title/i.test(e))).toBe(true);
	});

	it('rejects mixed subjects', () => {
		const result = parseTestBundleRows([row(), row({ subject: 'Marketing', stem: 'Other?' })]);
		expect(result.errors.some((e) => /subject không khớp/i.test(e.message ?? ''))).toBe(true);
	});

	it('rejects invalid correct_option', () => {
		const result = parseTestBundleRows([row({ correct_option: 'E' })]);
		expect(result.questions).toHaveLength(0);
		expect(result.errors.some((e) => e.missing.includes('correct_option'))).toBe(true);
	});

	it('flags question_count larger than valid questions', () => {
		const result = parseTestBundleRows([
			row({ question_count: '5' }),
			row({ stem: 'Second?', question_count: '5' }),
		]);
		expect(result.questions).toHaveLength(2);
		expect(result.metaErrors.some((e) => /question_count.*lớn hơn/i.test(e))).toBe(true);
	});

	it('accepts questions-only True/False as 2-option MCQ when requireMeta=false', () => {
		const result = parseTestBundleRows(
			[
				{
					topic: 'Ch1',
					stem: 'Many jobs now include managerial activities.',
					option_a: 'True',
					option_b: 'False',
					option_c: '',
					option_d: '',
					correct_option: 'A',
				},
			],
			{ requireMeta: false },
		);
		expect(result.metaErrors).toEqual([]);
		expect(result.errors).toEqual([]);
		expect(result.questions).toHaveLength(1);
		expect(result.questions[0]?.optionA).toBe('True');
		expect(result.questions[0]?.optionB).toBe('False');
		expect(result.questions[0]?.correctOption).toBe('A');
	});
});

describe('parseTestBundleCsvText', () => {
	it('parses SAMPLE_TEST_BUNDLE_CSV', () => {
		const result = parseTestBundleCsvText(SAMPLE_TEST_BUNDLE_CSV);
		expect(result.metaErrors).toEqual([]);
		expect(result.errors).toEqual([]);
		expect(result.meta?.title).toBe('Principles of Management — Sample Quiz');
		expect(result.questions).toHaveLength(8);
	});

	it('parses SAMPLE_SMART_QUESTIONS_CSV without meta', () => {
		const result = parseTestBundleCsvText(SAMPLE_SMART_QUESTIONS_CSV, {
			requireMeta: false,
		});
		expect(result.metaErrors).toEqual([]);
		expect(result.questions.length).toBeGreaterThanOrEqual(2);
	});

	it('parses header + one data row from text', () => {
		const csv = `${HEADER}
Sample Quiz,PoM,Ch1,Stem?,A,B,C,D,A`;
		const result = parseTestBundleCsvText(csv);
		expect(result.questions).toHaveLength(1);
		expect(result.meta?.title).toBe('Sample Quiz');
	});
});

describe('buildTestBundlePrompt', () => {
	it('embeds raw data and required CSV columns', () => {
		const prompt = buildTestBundlePrompt('Q1. What is management?\nA) ...');
		expect(prompt).toContain('Q1. What is management?');
		expect(prompt).toContain('topic,stem,option_a,option_b,option_c,option_d,correct_option');
		expect(prompt).toContain('Không điền');
		expect(prompt).toContain('test_title');
		expect(prompt).toContain('plain text');
	});

	it('instructs keeping True/False as 2-option MCQ and skipping essays only', () => {
		const prompt = buildTestBundlePrompt('sample raw');
		expect(prompt).toContain('True/False');
		expect(prompt).toContain('option_a` = True');
		expect(prompt).toContain('option_b` = False');
		expect(prompt).toContain('tự luận');
		expect(prompt).toContain('BỎ (tự luận)');
		expect(prompt).toContain('GIỮ (True/False');
		expect(prompt).toContain('copyright');
		expect(prompt).not.toMatch(/BỎ.*True\/False/i);
	});

	it('forbids file attachments and requires copy-pasteable chat CSV', () => {
		const prompt = buildTestBundlePrompt('sample raw');
		expect(prompt).toContain('CẤM');
		expect(prompt).toContain('.csv');
		expect(prompt).toContain('copy-paste');
		expect(prompt).toContain('MẪU ĐẦU RA');
		expect(prompt).toContain('code fence');
		expect(prompt).toMatch(/Toàn bộ phản hồi = CSV/);
	});
});

describe('buildCsvFixPrompt', () => {
	it('embeds broken CSV, schema, and validation errors', () => {
		const csv =
			'topic,stem,option_a,option_b,option_c,option_d,correct_option\nCh1,Q?,True,False,,C';
		const prompt = buildCsvFixPrompt({
			csv,
			errors: [
				{
					row: 2,
					missing: ['option_c'],
					message: 'correct_option=C nhưng option_c trống',
				},
			],
			metaErrors: ['Không có câu hỏi hợp lệ nào trong file'],
		});
		expect(prompt).toContain(csv);
		expect(prompt).toContain('Dòng 2: correct_option=C nhưng option_c trống');
		expect(prompt).toContain('Không có câu hỏi hợp lệ nào trong file');
		expect(prompt).toContain('topic,stem,option_a,option_b,option_c,option_d,correct_option');
		expect(prompt).toContain('đúng 11 cột');
		expect(prompt).toContain('plain text');
		expect(prompt).toContain('CẤM');
		expect(prompt).toContain('.csv');
	});
});
