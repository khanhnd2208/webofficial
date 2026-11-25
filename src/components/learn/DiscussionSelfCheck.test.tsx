import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import DiscussionSelfCheck, { DiscussionReview } from './DiscussionSelfCheck';

describe('DiscussionSelfCheck', () => {
	it('offers an answer box before the model answer', () => {
		const onAnswer = vi.fn();
		render(
			<DiscussionSelfCheck
				open={false}
				answer=""
				onAnswer={onAnswer}
				rating={null}
				onRate={vi.fn()}
			/>,
		);
		fireEvent.change(screen.getByLabelText(/Câu trả lời của bạn/), {
			target: { value: 'Linh đúng một phần' },
		});
		expect(onAnswer).toHaveBeenCalledWith('Linh đúng một phần');
		expect(screen.queryByRole('button', { name: 'Đúng ý' })).not.toBeInTheDocument();
	});

	it('shows the written answer and a self-rating once the model answer is open', () => {
		const onRate = vi.fn();
		render(
			<DiscussionSelfCheck
				open
				answer="Ý của tôi"
				onAnswer={vi.fn()}
				rating="partly"
				onRate={onRate}
			/>,
		);
		expect(screen.getByText('Ý của tôi')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Một phần' })).toHaveAttribute(
			'aria-pressed',
			'true',
		);
		fireEvent.click(screen.getByRole('button', { name: 'Chưa đúng' }));
		expect(onRate).toHaveBeenCalledWith('no');
		fireEvent.click(screen.getByRole('button', { name: 'Một phần' }));
		expect(onRate).toHaveBeenCalledWith(null);
	});
});

describe('DiscussionReview', () => {
	it('lists the questions rated partly or not yet right', () => {
		const onJump = vi.fn();
		render(<DiscussionReview ratings={['yes', 'no', null, 'partly']} onJump={onJump} />);
		expect(screen.getByText(/Bạn tự chấm 3 câu/)).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Câu 4' }));
		expect(onJump).toHaveBeenCalledWith(3);
		expect(screen.getByRole('button', { name: 'Câu 2' })).toBeInTheDocument();
	});

	it('stays hidden until something is rated', () => {
		const { container } = render(<DiscussionReview ratings={[null, null]} onJump={vi.fn()} />);
		expect(container).toBeEmptyDOMElement();
	});
});
