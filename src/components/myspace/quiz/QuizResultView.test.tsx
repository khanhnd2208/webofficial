import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import QuizResultView from './QuizResultView';

const fireConfetti = vi.hoisted(() => vi.fn());

vi.mock('canvas-confetti', () => ({ default: fireConfetti }));

const result = {
	score: 24,
	total: 30,
	review: [],
};

describe('QuizResultView', () => {
	beforeEach(() => {
		fireConfetti.mockReset();
	});

	it('shows a supplied completion note below the result summary', () => {
		render(
			<QuizResultView
				title="Practice test"
				result={result}
				completionNote={'Thầy chúc các bạn thi tốt nhé :">'}
				onRestart={vi.fn()}
			/>,
		);

		expect(screen.getByTestId('myspace-quiz-completion-note')).toHaveTextContent(
			'Thầy chúc các bạn thi tốt nhé :">',
		);
		expect(screen.getByRole('button', { name: /Nhận lời chúc/i })).toBeVisible();
	});

	it('hides the completion note and celebrates when the learner accepts it', async () => {
		render(
			<QuizResultView
				title="Practice test"
				result={result}
				completionNote={'Thầy chúc các bạn thi tốt nhé :">'}
				onRestart={vi.fn()}
			/>,
		);

		fireEvent.click(screen.getByRole('button', { name: /Nhận lời chúc/i }));

		expect(screen.queryByTestId('myspace-quiz-completion-note')).not.toBeInTheDocument();
		await vi.waitFor(() => expect(fireConfetti).toHaveBeenCalledTimes(2));
		expect(fireConfetti).toHaveBeenCalledWith(
			expect.objectContaining({ angle: 58, origin: { x: 0.08, y: 0.72 } }),
		);
	});

	it('does not render a note for other tests', () => {
		render(<QuizResultView title="Another test" result={result} onRestart={vi.fn()} />);

		expect(screen.queryByTestId('myspace-quiz-completion-note')).not.toBeInTheDocument();
	});
});
