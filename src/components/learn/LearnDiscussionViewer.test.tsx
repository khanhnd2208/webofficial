import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import LearnDiscussionViewer from './LearnDiscussionViewer';

const { adminFetch } = vi.hoisted(() => ({ adminFetch: vi.fn() }));

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('@/lib/admin/client', () => ({
	adminFetch,
}));

describe('LearnDiscussionViewer', () => {
	it('hides the sample answer until asked, then completes after every answer is opened', async () => {
		adminFetch.mockReset();
		adminFetch.mockResolvedValue({});
		const user = userEvent.setup();
		render(
			<LearnDiscussionViewer
				sectionId="s1"
				completed={false}
				discussion={{
					questions: [
						{ id: 'd1', question: 'Vì sao?', answer: 'Vì **nguồn gốc**.' },
						{ id: 'd2', question: 'Thế nào?', answer: 'Như sau.' },
					],
				}}
			/>,
		);

		expect(screen.queryByText('nguồn gốc')).not.toBeInTheDocument();
		await user.click(screen.getByRole('button', { name: 'Xem đáp án mẫu' }));
		expect(screen.getByText('nguồn gốc')).toBeInTheDocument();
		expect(adminFetch).not.toHaveBeenCalled();

		await user.click(screen.getByRole('button', { name: 'Câu tiếp →' }));
		expect(screen.getByText('Thế nào?')).toBeInTheDocument();
		await user.click(screen.getByRole('button', { name: 'Xem đáp án mẫu' }));
		await waitFor(() =>
			expect(adminFetch).toHaveBeenCalledWith('/api/learn/sections/s1/progress', {
				method: 'PATCH',
				body: JSON.stringify({ completed: true }),
			}),
		);
	});

	it('keeps arrow keys on questions after a reveal and does not re-complete after the learner un-marks', async () => {
		adminFetch.mockReset();
		adminFetch.mockResolvedValue({});
		window.history.replaceState(null, '', window.location.pathname);
		const user = userEvent.setup();
		const discussion ={ questions: [{ id: 'd1', question: 'Một?', answer: 'Đáp một.' }, { id: 'd2', question: 'Hai?', answer: 'Đáp hai.' }] };
		const { rerender } = render(<LearnDiscussionViewer sectionId="s-mark" completed={false} discussion={discussion} />);

		await user.click(await screen.findByRole('button', { name: 'Xem đáp án mẫu' }));
		await waitFor(() => expect(document.activeElement).toHaveAttribute('data-ln-stepper'));
		await user.keyboard('{ArrowRight}');
		expect(screen.getByText('Hai?')).toBeInTheDocument();
		await user.click(screen.getByRole('button', { name: 'Xem đáp án mẫu' }));
		await waitFor(() => expect(adminFetch).toHaveBeenCalledTimes(1));

		rerender(<LearnDiscussionViewer sectionId="s-mark" completed discussion={discussion} />);
		rerender(<LearnDiscussionViewer sectionId="s-mark" completed={false} discussion={discussion} />);
		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(adminFetch).toHaveBeenCalledTimes(1);
	});

	it('resumes the first unopened question when the url has no hash', async () => {
		window.localStorage.setItem('ln:discussion:s-resume', JSON.stringify({ opened: ['d1'], completed: false }));
		window.history.replaceState(null, '', window.location.pathname);
		render(
			<LearnDiscussionViewer
				sectionId="s-resume"
				completed={false}
				discussion={{
					questions: [
						{ id: 'd1', question: 'Một?', answer: 'Đáp một.' },
						{ id: 'd2', question: 'Hai?', answer: 'Đáp hai.' },
					],
				}}
			/>,
		);
		expect(await screen.findByText('Hai?')).toBeInTheDocument();
		expect(screen.queryByText('Một?')).not.toBeInTheDocument();
	});

	it('offers the next section once the last answer is open', async () => {
		window.localStorage.setItem('ln:discussion:s-next', JSON.stringify({ opened: ['d1', 'd2'], completed: true }));
		window.history.replaceState(null, '', `${window.location.pathname}#cau-2`);
		render(
			<LearnDiscussionViewer
				sectionId="s-next"
				completed
				nextHref="/my-space/courses/demo?s=s2"
				discussion={{
					questions: [
						{ id: 'd1', question: 'Một?', answer: 'Đáp một.' },
						{ id: 'd2', question: 'Hai?', answer: 'Đáp hai.' },
					],
				}}
			/>,
		);
		expect(await screen.findByRole('link', { name: 'Sang mục tiếp →' })).toHaveAttribute('href', '/my-space/courses/demo?s=s2');
	});
});
