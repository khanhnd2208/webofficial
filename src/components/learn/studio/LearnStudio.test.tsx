import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminApiError } from '@/lib/admin/client';
import type { LearnStudioCourse } from '@/features/learn/types';

import LearnStudio from './LearnStudio';

const { adminFetch, push } = vi.hoisted(() => ({ adminFetch: vi.fn(), push: vi.fn() }));

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('@/lib/admin/client', async () => {
	const actual = await vi.importActual<typeof import('@/lib/admin/client')>('@/lib/admin/client');
	return { ...actual, adminFetch };
});

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
		fireEvent.click(screen.getByRole('button', { name: 'Xuất bản…' }));
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
		fireEvent.click(screen.getByRole('button', { name: 'Thêm thao tác với khóa học' }));
		fireEvent.click(screen.getByRole('menuitem', { name: 'Chuyển về bản nháp…' }));
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Chuyển về bản nháp' })).toBeInTheDocument(),
		);
		expect(adminFetch).not.toHaveBeenCalled();
	});
	beforeEach(() => {
		adminFetch.mockReset();
		adminFetch.mockResolvedValue(undefined);
		push.mockReset();
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
		await waitFor(() =>
			expect(screen.getByRole('button', { name: /^Đã lưu · \d{2}:\d{2}$/ })).toBeDisabled(),
		);
	});

	it('keeps a blank section title local, then restores it on blur', async () => {
		render(<LearnStudio course={course} initialSectionId="section-1" />);
		const title = screen.getByRole('textbox', { name: 'Tên mục' });

		fireEvent.change(title, { target: { value: '   ' } });

		expect(screen.getByText('Tên mục không được để trống')).toBeInTheDocument();
		expect(title).toHaveAttribute('aria-invalid', 'true');
		expect(screen.getByRole('button', { name: 'Chưa lưu · 1 lỗi cần sửa' })).toHaveAttribute(
			'title',
			'Bấm để tới chỗ cần sửa',
		);
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 1_000));
		});
		expect(adminFetch).not.toHaveBeenCalled();

		fireEvent.blur(title);
		expect(screen.getByRole('textbox', { name: 'Tên mục' })).toHaveValue('Mục 1');
		expect(screen.getByText('Đã giữ lại tên cũ')).toBeInTheDocument();
	});

	it('waits for a save before leaving, and asks again when the save fails', async () => {
		render(<LearnStudio course={course} initialSectionId="section-1" />);
		fireEvent.click(screen.getByRole('link', { name: '← Về trang học' }));
		await waitFor(() => expect(push).toHaveBeenCalledWith('/khoa-hoc/demo?s=section-1'));

		push.mockReset();
		adminFetch.mockRejectedValueOnce(new AdminApiError('Mất mạng', { status: 500 }));
		fireEvent.click(screen.getByRole('tab', { name: /markdown/i }));
		fireEvent.change(screen.getByPlaceholderText(/Tiêu đề/), {
			target: { value: 'Chưa lên máy chủ' },
		});
		fireEvent.click(screen.getByRole('link', { name: '← Về trang học' }));
		await waitFor(() => expect(screen.getByRole('button', { name: 'Ở lại' })).toBeInTheDocument());
		fireEvent.click(screen.getByRole('button', { name: 'Ở lại' }));
		expect(push).not.toHaveBeenCalled();
	});

	it('hides a deleted section and restores it without sending DELETE', () => {
		render(<LearnStudio course={course} initialSectionId="section-1" />);
		fireEvent.click(screen.getByRole('button', { name: 'Xóa mục này' }));
		expect(screen.getByText('Đã xóa mục "Mục 1"')).toBeInTheDocument();
		expect(screen.queryByRole('textbox', { name: 'Tên mục' })).not.toBeInTheDocument();
		expect(adminFetch).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole('button', { name: 'Hoàn tác' }));
		expect(screen.getByRole('textbox', { name: 'Tên mục' })).toHaveValue('Mục 1');
		expect(screen.queryByText('Đã xóa mục "Mục 1"')).not.toBeInTheDocument();
		expect(adminFetch).not.toHaveBeenCalled();
	});

	it('opens the learner preview in a tab created during the click', async () => {
		const popup = { closed: false, location: { href: '' } };
		const open = vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window);
		render(<LearnStudio course={course} initialSectionId="section-1" />);

		fireEvent.click(screen.getByRole('button', { name: /Xem như học viên/ }));

		expect(open).toHaveBeenCalledWith('', '_blank');
		await waitFor(() => expect(popup.location.href).toBe('/khoa-hoc/demo?s=section-1'));
		open.mockRestore();
	});
});
