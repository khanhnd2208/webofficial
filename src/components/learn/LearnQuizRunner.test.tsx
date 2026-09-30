import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { LearnQuizForLearner, LearnQuizReview } from '@/features/learn/types';

import LearnQuizRunner from './LearnQuizRunner';

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const quiz: LearnQuizForLearner = {
	passingScorePercent: 70,
	timeLimitMinutes: null,
	questions: [
		{ id: 'q1', question: 'Câu một?', options: ['Đúng', 'Sai'] },
		{ id: 'q2', question: 'Câu hai?', options: ['A', 'B'] },
	],
};

const passed: LearnQuizReview = {
	result: {
		score: 2,
		total: 2,
		percentage: 100,
		passed: true,
		answers: { q1: 0, q2: 1 },
		completedAt: '2026-09-24T00:00:00.000Z',
	},
	key: [
		{ id: 'q1', correctIndex: 0, explanation: '' },
		{ id: 'q2', correctIndex: 1, explanation: '' },
	],
};

describe('LearnQuizRunner', () => {
	it('restores a saved draft and shows continue after a pass', async () => {
		window.sessionStorage.setItem('ln:quiz-draft:s1', JSON.stringify({ q1: 1 }));
		const { unmount } = render(<LearnQuizRunner sectionId="s1" quiz={quiz} initialReview={null} />);

		await waitFor(() =>
			expect(screen.getByRole('radio', { name: /Sai/ })).toHaveAttribute('aria-checked', 'true'),
		);
		unmount();

		render(
			<LearnQuizRunner
				sectionId="s1"
				quiz={quiz}
				initialReview={passed}
				nextHref="/my-space/courses/demo?s=s2"
			/>,
		);

		expect(screen.getByRole('link', { name: 'Tiếp tục →' })).toHaveAttribute(
			'href',
			'/my-space/courses/demo?s=s2',
		);
		expect(screen.getByText(/Đạt/)).toBeInTheDocument();
	});
});
