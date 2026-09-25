import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { LearnStudioCourse } from '@/features/learn/types';

import LearnStudio from './LearnStudio';

const { adminFetch } = vi.hoisted(() => ({ adminFetch: vi.fn() }));

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('@/lib/admin/client', () => ({
	adminFetch,
}));

const course: LearnStudioCourse = {
	id: 'course-1',
	slug: 'demo',
	title: 'Khóa demo',
	subtitle: '',
	description: '',
	category: 'Xã hội',
	level: 'BASIC',
	status: 'DRAFT',
	updatedAt: '2026-09-25T00:00:00.000Z',
	lessons: [
		{
			id: 'lesson-1',
			title: 'Bài 1',
			description: '',
			sections: [
				{
					id: 'section-1',
					lessonId: 'lesson-1',
					type: 'READING',
					title: 'Mục 1',
					durationMinutes: null,
					summary: '',
					keyTakeaways: [],
					markdown: 'Bản lúc mở',
					checkpoint: null,
					quiz: null,
					discussion: null,
					estimatedMinutes: 1,
					updatedAt: '2026-09-25T00:00:00.000Z',
				},
			],
		},
	],
};

describe('LearnStudio save button', () => {
	beforeEach(() => {
		adminFetch.mockReset();
		adminFetch.mockResolvedValue(undefined);
	});

	it('shows Lưu after an edit, patches on click, then shows Đã lưu', async () => {
		render(<LearnStudio course={course} initialSectionId="section-1" />);

		await waitFor(() => expect(screen.getByRole('toolbar', { name: 'Định dạng' })).toBeInTheDocument());
		expect(screen.getByRole('button', { name: 'Đã lưu ✓' })).toBeDisabled();

		fireEvent.click(screen.getByRole('tab', { name: /markdown/i }));
		fireEvent.change(screen.getByPlaceholderText(/Tiêu đề/), { target: { value: 'Bản đã sửa' } });

		const save = screen.getByRole('button', { name: 'Lưu' });
		expect(save).toBeEnabled();
		fireEvent.click(save);

		await waitFor(() => expect(adminFetch).toHaveBeenCalled());
		expect(adminFetch).toHaveBeenCalledWith(
			'/api/admin/learn/sections/section-1',
			expect.objectContaining({ method: 'PATCH' }),
		);
		await waitFor(() => expect(screen.getByRole('button', { name: 'Đã lưu ✓' })).toBeDisabled());
	});
});
