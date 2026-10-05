import { describe, expect, it } from 'vitest';

import { discussionQuestionView, splitLabelled, ANSWER_LABELS } from './discussionView';
import {
	ANSWER_SNIPPETS,
	PROMPT_SNIPPETS,
	insertAtCaret,
	nextPartSnippet,
	nextStepSnippet,
} from './discussionTemplates';

describe('discussion templates', () => {
	it('inserts at the caret', () => {
		expect(insertAtCaret('abcdef', 2, 4, 'X')).toEqual({ value: 'abXef', caret: 3 });
	});

	it('parses each prompt snippet into the block the learner view expects', () => {
		const part = nextPartSnippet([]);
		const markdown = `${part}Tên\n\n${PROMPT_SNIPPETS.title}Ngân sách\n\n${PROMPT_SNIPPETS.situation}Một tình huống.\n\n${PROMPT_SNIPPETS.ask}Hỏi gì?`;
		const view = discussionQuestionView(markdown);
		expect(view.part).toMatch(/^Phần 1\./);
		expect(view.level).toBe('Áp dụng');
		expect(view.title).toBe('Ngân sách');
		expect(view.blocks.map((block) => block.label)).toEqual(['Tình huống', 'Câu hỏi']);
	});

	it('parses each answer snippet into a labelled block', () => {
		const answer = [
			`${ANSWER_SNIPPETS.recall}Nhớ lại.`,
			`${ANSWER_SNIPPETS.steps}Làm thế này.`,
			nextStepSnippet(ANSWER_SNIPPETS.steps).trimEnd(),
			`${ANSWER_SNIPPETS.solution}Kết quả.`,
			`${ANSWER_SNIPPETS.takeaway}Rút ra.`,
		].join('\n\n');
		const labels = splitLabelled(answer, ANSWER_LABELS).map((block) => block.label);
		expect(labels).toEqual([
			'Nhắc lại bài học',
			'Cùng suy nghĩ từng bước',
			'Lời giải',
			'Điều rút ra',
		]);
		expect(answer).toContain('#### Bước 2 —');
	});
});
