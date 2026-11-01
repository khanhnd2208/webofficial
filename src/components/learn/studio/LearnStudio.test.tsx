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
	thumbnailUrl: null,
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
					discussion: null,
					estimatedMinutes: 1,
					updatedAt: '2026-09-25T00:00:00.000Z',
				},
			],
		},
	],
};

/** On a narrow screen the outline is a tab; a section is deleted from its row menu. */
function deleteFromOutline(title: string) {
	fireEvent.click(screen.getByRole('tab', { name: 'Mục lục' }));
	fireEvent.click(screen.getByRole('button', { name: `Thao tác mục: ${title}` }));
	fireEvent.click(screen.getByRole('menuitem', { name: 'Xóa mục' }));
	fireEvent.click(screen.getByRole('tab', { name: 'Nội dung' }));
}

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
			expect(screen.getByRole('textbox', { name: 'Nội dung Markdown' })).toBeInTheDocument(),
		);
		expect(screen.getByRole('button', { name: 'Đã lưu ✓' })).toBeDisabled();

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
		deleteFromOutline('Mục 1');
		expect(screen.getByText('Đã xóa mục "Mục 1"')).toBeInTheDocument();
		expect(screen.queryByRole('textbox', { name: 'Tên mục' })).not.toBeInTheDocument();
		expect(adminFetch).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole('button', { name: 'Hoàn tác' }));
		expect(screen.getByRole('textbox', { name: 'Tên mục' })).toHaveValue('Mục 1');
		expect(screen.queryByText('Đã xóa mục "Mục 1"')).not.toBeInTheDocument();
		expect(adminFetch).not.toHaveBeenCalled();
	});

	it('keeps the section name visible while switching areas from the keyboard', () => {
		render(<LearnStudio course={course} initialSectionId="section-1" />);
		expect(screen.getByText('Đang sửa: Bài 1 · Mục 1')).toBeInTheDocument();
		const content = screen.getByRole('tab', { name: 'Nội dung' });
		content.focus();
		fireEvent.keyDown(content, { key: 'ArrowLeft' });
		expect(screen.getByRole('tab', { name: 'Mục lục' })).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByText('Đang sửa: Bài 1 · Mục 1')).toBeInTheDocument();
		expect(screen.queryByRole('tab', { name: 'Thông tin' })).not.toBeInTheDocument();
	});

	it('keeps optional learner fields folded under the editor', () => {
		render(<LearnStudio course={course} initialSectionId="section-1" />);
		expect(screen.getByText('Tùy chọn hiển thị')).toBeInTheDocument();
		expect(screen.getByLabelText('Thời lượng')).not.toBeVisible();
	});

	it('stays inside the lesson after a delete instead of opening another lesson', () => {
		const draft = structuredClone(course);
		draft.lessons[0].sections.push({
			...draft.lessons[0].sections[0],
			id: 'section-2',
			title: 'Mục 2',
		});
		draft.lessons.push({
			id: 'lesson-2',
			title: 'Bài mới',
			description: '',
			sections: [
				{
					...draft.lessons[0].sections[0],
					id: 'section-3',
					lessonId: 'lesson-2',
					title: 'Mục mới',
				},
			],
		});
		render(<LearnStudio course={draft} initialSectionId="section-3" />);
		deleteFromOutline('Mục mới');
		expect(screen.queryByRole('textbox', { name: 'Tên mục' })).not.toBeInTheDocument();
		expect(screen.getByText('Chọn một mục để soạn')).toBeInTheDocument();
		expect(screen.getByText('Bài này chưa có mục nào.')).toBeInTheDocument();

		fireEvent.click(screen.getByRole('tab', { name: 'Mục lục' }));
		fireEvent.click(screen.getByRole('button', { name: 'Mục 1' }));
		deleteFromOutline('Mục 1');
		expect(screen.getByRole('textbox', { name: 'Tên mục' })).toHaveValue('Mục 2');
	});

	it('describes the course blurb as the overview introduction', () => {
		render(<LearnStudio course={course} initialSectionId="section-1" />);
		fireEvent.click(screen.getByRole('button', { name: 'Khóa demo' }));
		expect(screen.getByText('Hiện ở phần Giới thiệu, phía trên mục lục bài.')).toBeInTheDocument();
		expect(screen.queryByText(/đầu mục đầu tiên/)).not.toBeInTheDocument();
	});

	it('opens the learner preview in a tab created during the click', async () => {
		const popup = { closed: false, location: { href: '' } };
		const open = vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window);
		render(<LearnStudio course={course} initialSectionId="section-1" />);

		fireEvent.click(screen.getByRole('button', { name: 'Xem như học viên' }));

		expect(open).toHaveBeenCalledWith('', '_blank');
		await waitFor(() => expect(popup.location.href).toBe('/khoa-hoc/demo?s=section-1'));
		open.mockRestore();
	});

	it('puts the section back when delete fails and does not open the old preview', async () => {
		const popup = { closed: false, close: vi.fn(), location: { href: '' } };
		const open = vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window);
		const draft = structuredClone(course);
		draft.lessons[0].sections.push({
			...draft.lessons[0].sections[0],
			id: 'section-2',
			title: 'Mục 2',
		});
		adminFetch.mockRejectedValueOnce(new AdminApiError('Máy chủ từ chối', { status: 500 }));
		render(<LearnStudio course={draft} initialSectionId="section-1" />);

		deleteFromOutline('Mục 1');
		fireEvent.click(screen.getByRole('button', { name: 'Xem như học viên' }));

		await waitFor(() => expect(screen.getByText(/Máy chủ từ chối/)).toBeInTheDocument());
		expect(screen.getByText(/Mục vẫn còn, hãy thử xóa lại/)).toBeInTheDocument();
		expect(screen.getByRole('textbox', { name: 'Tên mục' })).toHaveValue('Mục 1');
		expect(popup.close).toHaveBeenCalled();
		expect(popup.location.href).toBe('');
		expect(adminFetch).toHaveBeenCalledWith(
			'/api/admin/learn/sections/section-1',
			expect.objectContaining({ method: 'DELETE' }),
		);
		open.mockRestore();
	});

	it('does not open publish when the section delete failed', async () => {
		adminFetch.mockRejectedValueOnce(new AdminApiError('Máy chủ từ chối', { status: 500 }));
		render(<LearnStudio course={course} initialSectionId="section-1" />);
		deleteFromOutline('Mục 1');
		fireEvent.click(screen.getByRole('button', { name: 'Xuất bản…' }));

		await waitFor(() =>
			expect(screen.getByText(/Mục vẫn còn, hãy thử xóa lại/)).toBeInTheDocument(),
		);
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		expect(screen.getByRole('textbox', { name: 'Tên mục' })).toHaveValue('Mục 1');
	});

	it('keeps typed markdown when switching areas', () => {
		render(<LearnStudio course={course} initialSectionId="section-1" />);
		const content = screen.getByRole('tab', { name: 'Nội dung' });
		expect(content).toHaveAttribute('aria-controls', 'ln-studio-panel-content');
		expect(document.getElementById('ln-studio-panel-content')).toHaveAttribute('role', 'tabpanel');
		expect(document.getElementById('ln-studio-panel-content')).toHaveAttribute(
			'aria-labelledby',
			'ln-studio-tab-content',
		);

		fireEvent.change(screen.getByRole('textbox', { name: 'Nội dung Markdown' }), {
			target: { value: 'Chữ vừa gõ' },
		});
		fireEvent.click(screen.getByRole('tab', { name: 'Mục lục' }));
		expect(screen.queryByRole('textbox', { name: 'Nội dung Markdown' })).not.toBeInTheDocument();
		fireEvent.click(content);
		expect(screen.getByRole('textbox', { name: 'Nội dung Markdown' })).toHaveValue('Chữ vừa gõ');
	});

	it('keeps a failed save, retries it, and does not preview the old page', async () => {
		const popup = { closed: false, close: vi.fn(), location: { href: '' } };
		const open = vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window);
		adminFetch.mockRejectedValue(new TypeError('Failed to fetch'));
		render(<LearnStudio course={course} initialSectionId="section-1" />);

		fireEvent.change(screen.getByRole('textbox', { name: 'Nội dung Markdown' }), {
			target: { value: 'Bản chưa lên mạng' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Lưu' }));
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Thử lại ngay' })).toBeInTheDocument(),
		);
		expect(screen.getByRole('textbox', { name: 'Nội dung Markdown' })).toHaveValue(
			'Bản chưa lên mạng',
		);

		fireEvent.click(screen.getByRole('button', { name: 'Xem như học viên' }));
		await waitFor(() => expect(popup.close).toHaveBeenCalled());
		expect(popup.location.href).toBe('');
		expect(screen.getByRole('textbox', { name: 'Nội dung Markdown' })).toHaveValue(
			'Bản chưa lên mạng',
		);

		adminFetch.mockReset();
		adminFetch.mockResolvedValue(undefined);
		fireEvent.click(screen.getByRole('button', { name: 'Thử lại ngay' }));
		await waitFor(() =>
			expect(screen.getByRole('button', { name: /^Đã lưu · \d{2}:\d{2}$/ })).toBeDisabled(),
		);
		expect(screen.getByRole('textbox', { name: 'Nội dung Markdown' })).toHaveValue(
			'Bản chưa lên mạng',
		);
		open.mockRestore();
	});

	it('shows a conflict instead of saving over another session', async () => {
		const popup = { closed: false, close: vi.fn(), location: { href: '' } };
		const open = vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window);
		adminFetch.mockImplementation((url: string, init?: RequestInit) => {
			if (init?.method === 'PATCH') {
				return Promise.reject(new AdminApiError('Mục vừa được sửa ở nơi khác', { status: 409 }));
			}
			return Promise.resolve({
				...course.lessons[0].sections[0],
				markdown: 'Bản máy chủ',
				updatedAt: '2026-10-19T01:00:00.000Z',
			});
		});
		render(<LearnStudio course={course} initialSectionId="section-1" />);

		fireEvent.change(screen.getByRole('textbox', { name: 'Nội dung Markdown' }), {
			target: { value: 'Bản của phiên này' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Lưu' }));
		await waitFor(() =>
			expect(
				screen.getByRole('heading', { name: 'Mục "Mục 1" vừa được sửa ở nơi khác' }),
			).toBeInTheDocument(),
		);

		fireEvent.change(screen.getByRole('textbox', { name: 'Tên mục' }), {
			target: { value: 'Tên gõ thêm' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Có bản khác' }));
		fireEvent.click(screen.getByRole('button', { name: 'Xem như học viên' }));
		await waitFor(() => expect(popup.close).toHaveBeenCalled());
		expect(popup.location.href).toBe('');
		const patches = adminFetch.mock.calls.filter(
			(call) => (call[1] as RequestInit | undefined)?.method === 'PATCH',
		);
		expect(patches).toHaveLength(1);
		expect(screen.getByRole('textbox', { name: 'Tên mục' })).toHaveValue('Tên gõ thêm');
		open.mockRestore();
	});
});
