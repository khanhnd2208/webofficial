import { describe, expect, it } from 'vitest';

import { discussionQuestionView } from './discussionView';
import { discussionIssues, quizIssues, sectionHint } from './questionHealth';
import type { LearnQuizQuestion, LearnStudioSection } from './types';

const quiz = (patch: Partial<LearnQuizQuestion> = {}): LearnQuizQuestion => ({
	id: 'q1',
	question: 'Hỏi?',
	options: ['Đúng', 'Sai'],
	correctIndex: 0,
	explanation: '',
	...patch,
});

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
		checkpoint: null,
		quiz: null,
		discussion: null,
		estimatedMinutes: 1,
		updatedAt: '2026-10-05T00:00:00.000Z',
		...patch,
	};
}

describe('question health', () => {
	it('flags an empty correct option separately from a blank distractor', () => {
		expect(quizIssues(quiz({ options: ['', 'Sai'], correctIndex: 0 }))).toEqual([
			'Đáp án đúng đang trống',
		]);
		expect(quizIssues(quiz({ options: ['Đúng', ''], correctIndex: 0 }))).toEqual([
			'Phương án trống',
		]);
		expect(quizIssues(quiz({ options: ['Chỉ một'] }))).toContain('Cần ít nhất 2 phương án');
	});

	it('flags a discussion prompt that has no question block', () => {
		const prompt = '### Áp dụng — Tên\n\nMột đoạn.';
		const view = discussionQuestionView(prompt);
		expect(discussionIssues({ question: prompt, answer: '' }, view)).toEqual([
			'Thiếu đáp án mẫu',
			'Chưa có khối Câu hỏi',
		]);
		expect(discussionIssues({ question: '', answer: 'Có' }, view)).toContain('Thiếu đề bài');
	});

	it('describes an empty reading and a quiz that needs work', () => {
		expect(sectionHint(section({ markdown: '   ' }))).toEqual({ text: 'Trống', warn: true });
		expect(sectionHint(section({ markdown: 'Có chữ' }))).toBeNull();
		expect(
			sectionHint(
				section({
					type: 'QUIZ',
					quiz: {
						passingScorePercent: 70,
						timeLimitMinutes: null,
						questions: [quiz({ options: ['', ''] })],
					},
				}),
			),
		).toEqual({ text: '1 câu', warn: true });
	});
});
