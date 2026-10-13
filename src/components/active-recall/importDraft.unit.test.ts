import { describe, it, expect } from 'vitest';
import { previewDraftImport } from './importDraft';

const card = { id: 'c1', question: 'Question', answer: 'Answer', questionVi: '', answerVi: '' };

describe('draft import', () => {
	it('skips duplicates in the same paste and existing draft', () => {
		const result = previewDraftImport(
			'Q: Question\nA: Answer\n---\nQ: New\nA: New answer\n---\nQ: New\nA: New answer',
			[card],
			'append',
		);
		expect(result.summary).toMatchObject({ valid: 3, duplicates: 2, invalid: 0 });
		expect(result.rows.map((row) => row.action)).toEqual(['skip', 'create', 'skip']);
	});
	it('preserves different translations and formatting', () => {
		const result = previewDraftImport(
			'Q: Question\nA: Answer\nQVI: Câu hỏi\nAVI: Đáp án\n---\nQ: **Question**\nA: Answer',
			[card],
			'append',
		);
		expect(result.summary.duplicates).toBe(0);
	});
	it('updates owned IDs and rejects foreign IDs', () => {
		const result = previewDraftImport(
			'id,question,answer\nc1,New,Answer\nother,New,Answer',
			[card],
			'append',
		);
		expect(result.rows[0]?.action).toBe('update');
		expect(result.rows[1]?.errors).toContain(
			'ID thẻ không thuộc bộ này. Xóa cột ID nếu muốn tạo thẻ mới.',
		);
	});
	it('allows replacement at the limit and rejects append overflow', () => {
		const cards = Array.from({ length: 1000 }, (_, index) => ({ ...card, id: `c${index}` }));
		expect(previewDraftImport('Q: New\nA: New answer', cards, 'append').summary.invalid).toBe(1);
		expect(previewDraftImport('Q: New\nA: New answer', cards, 'replace').summary.invalid).toBe(0);
	});
	it('reflects draft edits between previews', () => {
		const cards = [{ ...card }];
		const text = 'Q: Question\nA: Answer';
		expect(previewDraftImport(text, cards, 'append').summary.duplicates).toBe(1);
		cards[0]!.answer = 'Edited answer';
		expect(previewDraftImport(text, cards, 'append').summary.duplicates).toBe(0);
	});
	it('ignores only entirely empty placeholders', () => {
		const empty = { question: '', answer: '', questionVi: '', answerVi: '' };
		const result = previewDraftImport(
			'Q: New\nA: New answer',
			Array.from({ length: 1000 }, () => empty),
			'append',
		);
		expect(result.summary.invalid).toBe(0);
	});
});
