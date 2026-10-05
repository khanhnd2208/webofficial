import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import DiscussionQuestionCard from './DiscussionQuestionCard';

describe('DiscussionQuestionCard', () => {
	it('opens the sample answer without touching storage', () => {
		const setItem = vi.spyOn(Storage.prototype, 'setItem');
		const onOpenChange = vi.fn();
		render(
			<DiscussionQuestionCard
				index={0}
				view={{
					part: null,
					level: 'Áp dụng',
					title: 'Ngân sách',
					blocks: [{ label: 'Câu hỏi', markdown: 'Hỏi gì?' }],
				}}
				answer="Vì vậy."
				open={false}
				onOpenChange={onOpenChange}
			/>,
		);
		expect(screen.getByRole('heading', { name: /Ngân sách/ })).toBeInTheDocument();
		expect(screen.queryByText('Vì vậy.')).not.toBeInTheDocument();
		expect(setItem).not.toHaveBeenCalled();
		setItem.mockRestore();
	});

	it('hides the answer again', () => {
		const onOpenChange = vi.fn();
		render(
			<DiscussionQuestionCard
				index={1}
				view={{ part: null, level: null, title: null, blocks: [] }}
				answer="Lời giải"
				open
				onOpenChange={onOpenChange}
			/>,
		);
		fireEvent.click(screen.getByRole('button', { name: 'Ẩn đáp án' }));
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});
});
