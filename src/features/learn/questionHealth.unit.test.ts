import { describe, expect, it } from 'vitest';

import { discussionQuestionView } from './discussionView';
import { discussionIssues, sectionHint } from './questionHealth';
import type { LearnStudioSection } from './types';

function section(patch: Partial<LearnStudioSection>): LearnStudioSection {
	return {
		id: 's',
		lessonId: 'l',
		type: 'READING',
		title: 'Mục',
		durationMinutes: null,
		summary: '',
		keyTakeaways: [],
		markdown: 'Có chữ',
		discussion: null,
		estimatedMinutes: 1,
		updatedAt: '2026-10-05T00:00:00.000Z',
		...patch,
	};
}

describe('question health', () => {
	it('flags a discussion prompt that has no question block', () => {
		const prompt = '### Áp dụng — Tên\n\nMột đoạn.';
		const view = discussionQuestionView(prompt);
		expect(discussionIssues({ question: prompt, answer: '' }, view)).toEqual([
			'Thiếu đáp án mẫu',
			'Chưa có khối Câu hỏi',
		]);
		expect(discussionIssues({ question: '', answer: 'Có' }, view)).toContain('Thiếu đề bài');
	});

	it('describes an empty reading and a discussion that needs work', () => {
		expect(sectionHint(section({ markdown: '   ' }))).toEqual({ text: 'Trống', warn: true });
		expect(sectionHint(section({ markdown: 'Có chữ' }))).toBeNull();
		expect(
			sectionHint(
				section({
					type: 'DISCUSSION',
					discussion: { questions: [{ id: 'd1', question: '', answer: '' }] },
				}),
			),
		).toEqual({ text: '1 câu', warn: true });
	});
});
