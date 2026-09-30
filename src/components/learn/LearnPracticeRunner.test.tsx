import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { LearnQuizQuestion } from '@/features/learn/types';

import LearnPracticeRunner from './LearnPracticeRunner';

const { adminFetch } = vi.hoisted(() => ({ adminFetch: vi.fn() }));

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('@/lib/admin/client', () => ({
	adminFetch,
}));

const questions: LearnQuizQuestion[] = [
	{
		id: 'q1',
		question: 'Câu **một**?',
		options: ['Đúng', 'Sai'],
		correctIndex: 0,
		explanation: 'Vì **đúng**.',
	},
	{ id: 'q2', question: 'Câu hai?', options: ['A', 'B'], correctIndex: 1, explanation: '' },
];

describe('LearnPracticeRunner', () => {
	it('reveals the explanation, moves between questions, and completes once every question is answered', async () => {
		adminFetch.mockReset();
		adminFetch.mockResolvedValue({});
		const user = userEvent.setup();
		render(
			<LearnPracticeRunner
				sectionId="s1"
				questions={questions}
				completed={false}
				nextHref="/my-space/courses/demo?s=s2"
			/>,
		);

		await user.click(await screen.findByRole('radio', { name: /Sai/ }));
		expect(screen.getByText(/Chưa đúng/)).toBeInTheDocument();
		expect(screen.getByText('đúng')).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Câu tiếp →' }));
		await user.click(screen.getByRole('radio', { name: 'BB' }));
		await waitFor(() =>
			expect(adminFetch).toHaveBeenCalledWith('/api/learn/sections/s1/progress', {
				method: 'PATCH',
				body: JSON.stringify({ completed: true }),
			}),
		);

		await user.click(screen.getByRole('button', { name: 'Xem tổng kết' }));
		expect(screen.getByText('1/2')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Làm lại câu sai' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Sang mục tiếp →' })).toHaveAttribute(
			'href',
			'/my-space/courses/demo?s=s2',
		);
	});

	it('keeps focus in the stepper after a pick, so the arrow key moves to the next question', async () => {
		adminFetch.mockReset();
		adminFetch.mockResolvedValue({});
		const user = userEvent.setup();
		render(<LearnPracticeRunner sectionId="s-focus" questions={questions} completed={false} />);

		await user.click(await screen.findByRole('radio', { name: /Đúng/ }));
		await waitFor(() => expect(screen.getByRole('button', { name: 'Câu tiếp →' })).toHaveFocus());
		await user.keyboard('{ArrowRight}');
		expect(screen.getByText('Câu hai?')).toBeInTheDocument();
	});
});
