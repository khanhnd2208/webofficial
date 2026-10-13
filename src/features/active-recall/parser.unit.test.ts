import { describe, expect, it } from 'vitest';

import { previewRecallImport, toRecallCsv, toRecallPaste } from './parser';
import { recallVisibleText } from './richText';

describe('Active Recall import parser', () => {
	it('parses multiline Q/A paste content', () => {
		const preview = previewRecallImport(
			'Q: What is HRM?\nA: A system.\n\n- with policies\n---\nQuestion: Why?\nAnswer: Because it matters.',
		);
		expect(preview.format).toBe('paste');
		expect(preview.summary).toMatchObject({ valid: 2, invalid: 0 });
		expect(recallVisibleText(preview.rows[0]?.answer)).toContain('with policies');
	});

	it('parses an inline A: marker and preserves an ordered list in the answer', () => {
		const preview = previewRecallImport(
			'Q: Describe the main steps in selection. A:\n\n1. Review applications\n2. Test candidates\n3. Interview finalists',
		);

		expect(preview.summary).toMatchObject({ valid: 1, invalid: 0 });
		expect(recallVisibleText(preview.rows[0]?.question)).toBe(
			'Describe the main steps in selection.',
		);
		expect(preview.rows[0]?.answer).toContain('<ol>');
		expect(preview.rows[0]?.answer).toContain('<li>Review applications</li>');
	});

	it('parses quoted multiline CSV and exports a portable round trip', () => {
		const csv = 'id,question,answer,order\ncard-1,"Question, one","First line\nSecond line",0';
		const preview = previewRecallImport(csv);
		expect(preview.format).toBe('csv');
		expect(preview.rows[0]).toMatchObject({
			id: 'card-1',
			order: 0,
			errors: [],
		});
		expect(recallVisibleText(preview.rows[0]?.question)).toBe('Question, one');
		expect(recallVisibleText(preview.rows[0]?.answer)).toBe('First line\nSecond line');
		const output = toRecallCsv([
			{ id: 'card-1', question: 'Question, one', answer: 'First line\nSecond line', position: 0 },
		]);
		const roundTrip = previewRecallImport(output).rows[0];
		expect(recallVisibleText(roundTrip?.question)).toBe('Question, one');
		expect(recallVisibleText(roundTrip?.answer)).toBe('First line\nSecond line');
	});

	it('imports markdown formatting from Q:/A: paste and exports it again', () => {
		const preview = previewRecallImport(
			'Q: What is **HRM**?\nA: A *system* with <u>policies</u> and <span style="color: #dc2626">risk</span>.',
		);
		expect(preview.summary.valid).toBe(1);
		expect(preview.rows[0]?.question).toContain('<strong>HRM</strong>');
		expect(preview.rows[0]?.answer).toContain('<em>system</em>');
		expect(preview.rows[0]?.answer).toContain('<u>policies</u>');
		expect(preview.rows[0]?.answer).toContain('<span style="color: #dc2626">risk</span>');

		const copied = toRecallPaste([
			{ question: preview.rows[0]!.question, answer: preview.rows[0]!.answer },
		]);
		expect(copied).toContain('**HRM**');
		expect(copied).toContain('*system*');
		const again = previewRecallImport(copied);
		expect(recallVisibleText(again.rows[0]?.question)).toBe(
			recallVisibleText(preview.rows[0]?.question),
		);
		expect(recallVisibleText(again.rows[0]?.answer)).toBe(
			recallVisibleText(preview.rows[0]?.answer),
		);
	});

	it('accepts TSV copied from a spreadsheet', () => {
		const preview = previewRecallImport('question\tanswer\nWhat is HRM?\tA people system');
		expect(preview.format).toBe('tsv');
		expect(preview.summary.valid).toBe(1);
		expect(recallVisibleText(preview.rows[0]?.question)).toBe('What is HRM?');
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
			expect.arrayContaining(['Câu hỏi vượt quá 2000 ký tự', 'Đáp án vượt quá 10000 ký tự']),
		);
	});

	it('rejects empty HTML after sanitizing', () => {
		const preview = previewRecallImport('Q: <p><br></p>\nA: A valid answer');
		expect(preview.summary).toMatchObject({ valid: 0, invalid: 1 });
		expect(preview.rows[0]?.errors).toContain('Thiếu câu hỏi');
	});

	it('keeps CSV/TSV headers even when cells contain Q:/A: labels', () => {
		const preview = previewRecallImport(
			'id,question,answer,order\ncard-1,"Q: still one card","A: not a second card",0',
		);
		expect(preview.format).toBe('csv');
		expect(preview.summary).toMatchObject({ valid: 1, invalid: 0 });
		expect(recallVisibleText(preview.rows[0]?.question)).toBe('Q: still one card');
	});

	it('round-trips nested underline and color through CSV and Q/A paste', () => {
		const question = '<p>What is <u><span style="color: #dc2626">HRM</span></u>?</p>';
		const answer =
			'<p><span style="color: #dc2626"><u>risk</u></span> and <strong>Human</strong> <em>resources</em></p>';
		const csv = toRecallCsv([{ id: 'card-1', question, answer, position: 0 }]);
		expect(csv).not.toContain('\u0000');
		const fromCsv = previewRecallImport(csv);
		expect(fromCsv.summary.valid).toBe(1);
		expect(fromCsv.rows[0]?.question).toContain('<u><span style="color: #dc2626">HRM</span></u>');
		expect(fromCsv.rows[0]?.answer).toContain('<span style="color: #dc2626"><u>risk</u></span>');
		expect(recallVisibleText(fromCsv.rows[0]?.answer)).toBe('risk and Human resources');

		const paste = toRecallPaste([{ question, answer }]);
		expect(paste).not.toContain('\u0000');
		const fromPaste = previewRecallImport(paste);
		expect(fromPaste.summary.valid).toBe(1);
		expect(recallVisibleText(fromPaste.rows[0]?.question)).toBe(recallVisibleText(question));
		expect(recallVisibleText(fromPaste.rows[0]?.answer)).toBe(recallVisibleText(answer));
	});

	it('preserves literal asterisks and Q:/A: lines inside exported paste', () => {
		const question = '<p>See file_name_test and 2 * 3 * 4</p>';
		const answer = '<p>Q: not a new card</p>';
		const paste = toRecallPaste([{ question, answer }]);
		expect(paste).toContain('\\Q: not a new card');
		const preview = previewRecallImport(paste);
		expect(preview.summary.valid).toBe(1);
		expect(recallVisibleText(preview.rows[0]?.question)).toBe('See file_name_test and 2 * 3 * 4');
		expect(preview.rows[0]?.question).not.toContain('<em>');
		expect(recallVisibleText(preview.rows[0]?.answer)).toBe('Q: not a new card');
	});

	it('parses optional QVI:/AVI: Vietnamese translation lines in paste content', () => {
		const preview = previewRecallImport(
			'Q: What is HRM?\nA: A system.\nQVI: HRM là gì?\nAVI: Một hệ thống.\n---\nQ: No translation here\nA: Plain answer',
		);
		expect(preview.summary).toMatchObject({ valid: 2, invalid: 0 });
		expect(recallVisibleText(preview.rows[0]?.questionVi)).toBe('HRM là gì?');
		expect(recallVisibleText(preview.rows[0]?.answerVi)).toBe('Một hệ thống.');
		expect(recallVisibleText(preview.rows[1]?.questionVi)).toBe('');
		expect(recallVisibleText(preview.rows[1]?.answerVi)).toBe('');
	});

	it('round-trips Vietnamese translations through CSV export/import', () => {
		const csv = toRecallCsv([
			{
				id: 'card-1',
				question: 'What is HRM?',
				answer: 'A system.',
				questionVi: 'HRM là gì?',
				answerVi: 'Một hệ thống.',
				position: 0,
			},
		]);
		expect(csv).toContain('questionVi');
		expect(csv).toContain('answerVi');
		const preview = previewRecallImport(csv);
		expect(preview.format).toBe('csv');
		expect(preview.summary).toMatchObject({ valid: 1, invalid: 0 });
		expect(recallVisibleText(preview.rows[0]?.questionVi)).toBe('HRM là gì?');
		expect(recallVisibleText(preview.rows[0]?.answerVi)).toBe('Một hệ thống.');
	});

	it('round-trips Vietnamese translations through Q/A paste export/import', () => {
		const paste = toRecallPaste([
			{
				question: 'What is HRM?',
				answer: 'A system.',
				questionVi: 'HRM là gì?',
				answerVi: 'Một hệ thống.',
			},
		]);
		expect(paste).toContain('QVI: HRM là gì?');
		expect(paste).toContain('AVI: Một hệ thống.');
		const preview = previewRecallImport(paste);
		expect(preview.summary).toMatchObject({ valid: 1, invalid: 0 });
		expect(recallVisibleText(preview.rows[0]?.questionVi)).toBe('HRM là gì?');
		expect(recallVisibleText(preview.rows[0]?.answerVi)).toBe('Một hệ thống.');
	});

	it('omits QVI:/AVI: lines from paste export when a card has no translation', () => {
		const paste = toRecallPaste([{ question: 'What is HRM?', answer: 'A system.' }]);
		expect(paste).not.toContain('QVI:');
		expect(paste).not.toContain('AVI:');
	});

	it('reads quoted headers and multiline Excel cells', () => {
		const csv = previewRecallImport('"question","answer"\n"Question","Answer"');
		expect(csv.summary.valid).toBe(1);
		const tsv = previewRecallImport('question\tanswer\n"Question"\t"First line\nSecond line"');
		expect(tsv.summary).toMatchObject({ valid: 1, invalid: 0 });
		expect(recallVisibleText(tsv.rows[0]?.answer)).toBe('First line\nSecond line');
	});
	it('rejects malformed quoted Excel cells and negative order', () => {
		expect(previewRecallImport('question\tanswer\nQuestion\t"unclosed').summary.invalid).toBe(1);
		expect(
			previewRecallImport('question\tanswer\torder\nQuestion\tAnswer\t-1').summary.invalid,
		).toBe(1);
	});
});
