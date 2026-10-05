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
	it('asks before publishing unresolved images and can navigate to the affected section', async () => {
		const draft = structuredClone(course);
		draft.lessons[0].sections[0].markdown = '![x](hinh-1.png)';
		render(<LearnStudio course={draft} initialSectionId="section-1" />);
		fireEvent.click(screen.getByRole('radio', { name: 'Xuất bản' }));
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Vẫn xuất bản' })).toBeInTheDocument(),
		);
		expect(screen.getByText('Bài 1 · Mục 1: 1 ảnh chưa tải lên')).toBeInTheDocument();
		expect(adminFetch).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('button', { name: 'Đi tới mục' }));
		expect(screen.queryByRole('button', { name: 'Vẫn xuất bản' })).not.toBeInTheDocument();
	});
	it('requires explicit confirmation before hiding a published course', async () => {
		render(
			<LearnStudio course={{ ...course, status: 'PUBLISHED' }} initialSectionId="section-1" />,
		);
		fireEvent.click(screen.getByRole('radio', { name: 'Bản nháp' }));
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Chuyển về bản nháp' })).toBeInTheDocument(),
		);
		expect(adminFetch).not.toHaveBeenCalled();
	});
	beforeEach(() => {
		adminFetch.mockReset();
		adminFetch.mockResolvedValue(undefined);
	});

	it('shows Lưu after an edit, patches on click, then shows Đã lưu', async () => {
		render(<LearnStudio course={course} initialSectionId="section-1" />);

		await waitFor(() =>
			expect(screen.getByRole('toolbar', { name: 'Định dạng' })).toBeInTheDocument(),
		);
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
