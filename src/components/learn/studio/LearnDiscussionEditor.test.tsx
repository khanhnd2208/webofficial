import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { LearnDiscussion } from '@/features/learn/types';

import LearnDiscussionEditor, { keepQuestionIds } from './LearnDiscussionEditor';

vi.mock('@/lib/admin/client', () => ({ adminFetch: vi.fn() }));

const discussion: LearnDiscussion = {
	questions: [
		{ id: 'q1', question: 'Câu một', answer: 'Đáp một' },
		{ id: 'q2', question: 'Câu hai', answer: 'Đáp hai' },
	],
};

function source() {
	return screen.getByRole('textbox', { name: 'Câu hỏi phản biện (Markdown)' });
}

describe('LearnDiscussionEditor', () => {
	it('shows the question bank as one Markdown document', () => {
		render(<LearnDiscussionEditor discussion={discussion} onChange={vi.fn()} />);
		expect(source()).toHaveValue(
			'Câu 1: Câu một\n\nĐáp án mẫu:\nĐáp một\n\nCâu 2: Câu hai\n\nĐáp án mẫu:\nĐáp hai',
		);
		expect(screen.getByText('2 câu')).toBeInTheDocument();
	});

	it('saves an edit as questions and keeps the ids learners already opened', () => {
		const onChange = vi.fn();
		render(<LearnDiscussionEditor discussion={discussion} onChange={onChange} />);
		fireEvent.change(source(), {
			target: {
				value:
					'Câu 1: Câu một đã sửa\n\nĐáp án mẫu:\nĐáp một\n\nCâu 2: Câu hai\n\nĐáp án mẫu:\nĐáp hai\n\nCâu 3: Câu ba\n\nĐáp án mẫu:\nĐáp ba',
			},
		});
		const last = onChange.mock.calls.at(-1)?.[0] as LearnDiscussion;
		expect(last.questions.map((item) => item.question)).toEqual([
			'Câu một đã sửa',
			'Câu hai',
			'Câu ba',
		]);
		expect(last.questions[0].id).toBe('q1');
		expect(last.questions[1].id).toBe('q2');
		expect(last.questions[2].id).not.toMatch(/^q[12]$/);
	});

	it('never wipes saved questions while the text has no question yet', () => {
		const onChange = vi.fn();
		render(<LearnDiscussionEditor discussion={discussion} onChange={onChange} />);
		fireEvent.change(source(), { target: { value: 'đang gõ dở' } });
		expect(onChange).not.toHaveBeenCalled();
		expect(screen.getByText(/Chưa nhận ra câu nào nên chưa lưu/)).toBeInTheDocument();

		fireEvent.change(source(), { target: { value: '' } });
		expect(onChange).toHaveBeenLastCalledWith({ questions: [] });
	});
});

describe('keepQuestionIds', () => {
	it('follows a moved question by its text before falling back to its position', () => {
		const previous = [
			{ id: 'a', question: 'A', answer: '' },
			{ id: 'b', question: 'B', answer: '' },
		];
		const parsed = [
			{ id: 'n1', question: 'B', answer: '' },
			{ id: 'n2', question: 'A sửa', answer: '' },
		];
		expect(keepQuestionIds(parsed, previous).map((item) => item.id)).toEqual(['b', 'n2']);
	});
});
