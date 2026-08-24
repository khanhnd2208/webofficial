import { describe, expect, it } from 'vitest';

import { previewRecallImport, toRecallCsv } from './parser';

describe('Active Recall import parser', () => {
	it('parses multiline Q/A paste content', () => {
		const preview = previewRecallImport(
			'Q: What is HRM?\nA: A system.\n\n- with policies\n---\nQuestion: Why?\nAnswer: Because it matters.',
		);
		expect(preview.format).toBe('paste');
		expect(preview.summary).toMatchObject({ valid: 2, invalid: 0 });
		expect(preview.rows[0]?.answer).toContain('- with policies');
	});

	it('parses quoted multiline CSV and exports a portable round trip', () => {
		const csv = 'id,question,answer,order\ncard-1,"Question, one","First line\nSecond line",0';
		const preview = previewRecallImport(csv);
		expect(preview.format).toBe('csv');
		expect(preview.rows[0]).toMatchObject({
			id: 'card-1',
			question: 'Question, one',
			answer: 'First line\nSecond line',
			order: 0,
			errors: [],
		});
		const output = toRecallCsv([
			{ id: 'card-1', question: 'Question, one', answer: 'First line\nSecond line', position: 0 },
		]);
		expect(previewRecallImport(output).rows[0]).toMatchObject({
			question: 'Question, one',
			answer: 'First line\nSecond line',
		});
	});

	it('accepts TSV copied from a spreadsheet', () => {
		const preview = previewRecallImport('question\tanswer\nWhat is HRM?\tA people system');
		expect(preview.format).toBe('tsv');
		expect(preview.summary.valid).toBe(1);
	});

	it('reports answer-only input instead of creating empty fronts', () => {
		const preview = previewRecallImport(
			Array.from({ length: 50 }, (_, index) => `Answer: ${index + 1}`).join('\n'),
		);
		expect(preview.summary).toMatchObject({ total: 0, valid: 0, orphanAnswers: 50 });
	});

	it('rejects imported cards that exceed the editor field limits', () => {
		const preview = previewRecallImport(`Q: ${'q'.repeat(2_001)}\nA: ${'a'.repeat(10_001)}`);

		expect(preview.summary).toMatchObject({ total: 1, valid: 0, invalid: 1 });
		expect(preview.rows[0]?.errors).toEqual(
			expect.arrayContaining([
				'Câu hỏi vượt quá 2000 ký tự',
				'Đáp án vượt quá 10000 ký tự',
			]),
		);
	});
});
