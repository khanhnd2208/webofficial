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
					updatedAt: '2026-09-25T00:00:00.000Z',
				},
			],
		},
	],
};

describe('LearnStudio editor reload', () => {
	beforeEach(() => {
		adminFetch.mockReset();
		adminFetch.mockResolvedValue(undefined);
	});

	it('shows the opened text again after undoing every edit in the session', async () => {
		render(<LearnStudio course={course} initialSectionId="section-1" />);

		await waitFor(() => expect(screen.getByRole('toolbar', { name: 'Định dạng' })).toBeInTheDocument());
		fireEvent.click(screen.getByRole('tab', { name: /markdown/i }));
		fireEvent.change(screen.getByPlaceholderText(/Tiêu đề/), { target: { value: 'Bản đã sửa' } });

		fireEvent.click(await screen.findByRole('button', { name: /chỗ đã sửa · Xem/ }));
		fireEvent.click(screen.getByRole('button', { name: 'Hoàn tác tất cả về lúc mở' }));

		await waitFor(() => expect(screen.getByRole('toolbar', { name: 'Định dạng' })).toBeInTheDocument());
		expect(document.querySelector('.ln-editor__content')?.textContent).toContain('Bản lúc mở');
		expect(document.querySelector('.ln-editor__content')?.textContent).not.toContain('Bản đã sửa');
	});
});
