import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LearnCompleteButton from './LearnCompleteButton';

const { push, refresh, adminFetch } = vi.hoisted(() => ({
	push: vi.fn(),
	refresh: vi.fn(),
	adminFetch: vi.fn(),
}));

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push, refresh }),
}));

vi.mock('@/lib/admin/client', () => ({
	adminFetch,
}));

describe('LearnCompleteButton', () => {
	beforeEach(() => {
		push.mockReset();
		refresh.mockReset();
		adminFetch.mockReset();
		adminFetch.mockResolvedValue(undefined);
	});

	it('marks the section done and continues when it is unfinished', async () => {
		render(
			<LearnCompleteButton
				sectionId="s1"
				completed={false}
				nextHref="/my-space/courses/demo?s=s2"
				nextTitle="Mục sau"
			/>,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Hoàn thành & tiếp →' }));
		expect(adminFetch).toHaveBeenCalledWith(
			'/api/learn/sections/s1/progress',
			expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ completed: true }) }),
		);
		await vi.waitFor(() => expect(push).toHaveBeenCalledWith('/my-space/courses/demo?s=s2'));
	});

	it('offers the next section and a quiet unmark link once the section is done', () => {
		render(
			<LearnCompleteButton
				sectionId="s1"
				completed
				nextHref="/my-space/courses/demo?s=s2"
				nextTitle="Mục sau"
			/>,
		);

		expect(screen.getByRole('link', { name: 'Tiếp: Mục sau →' })).toHaveAttribute(
			'href',
			'/my-space/courses/demo?s=s2',
		);
		expect(screen.getByRole('button', { name: 'Bỏ đánh dấu' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Hoàn thành & tiếp →' })).not.toBeInTheDocument();
	});

	it('names the course-finishing action when this is the last section', () => {
		render(
			<LearnCompleteButton
				sectionId="s1"
				completed={false}
				nextHref={null}
				finishesCourse
				overviewHref="/my-space/courses/demo"
			/>,
		);

		expect(screen.getByRole('button', { name: 'Hoàn thành khóa học' })).toBeInTheDocument();
	});
});
