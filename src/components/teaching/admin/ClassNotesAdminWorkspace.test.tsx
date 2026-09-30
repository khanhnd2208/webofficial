import { act, fireEvent, render, screen } from '@testing-library/react';
import Link from 'next/link';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { TeachingClassNoteRecord } from '@/features/teaching/types';

import { ClassNotesAdminWorkspace } from './ClassNotesAdminWorkspace';
import { teachingApi } from './api';

vi.mock('next/dynamic', () => ({
	default: () =>
		function MockTiptapEditor({
			content,
			onChange,
		}: {
			content: string;
			onChange: (html: string) => void;
		}) {
			return (
				<textarea
					aria-label="Nội dung note"
					value={content}
					onChange={(event) => onChange(event.target.value)}
				/>
			);
		},
}));

vi.mock('./api', () => ({ teachingApi: vi.fn() }));

const apiMock = vi.mocked(teachingApi);

function note(overrides: Partial<TeachingClassNoteRecord> = {}): TeachingClassNoteRecord {
	return {
		id: 'note-1',
		classId: 'class-1',
		draftTitle: 'Tuần 1',
		draftHtml: '<p>Nội dung tuần 1</p>',
		publishedTitle: null,
		publishedHtml: null,
		displayOrder: 0,
		publishedAt: null,
		updatedAt: '2026-08-26T00:00:00.000Z',
		status: 'DRAFT',
		...overrides,
	};
}

describe('ClassNotesAdminWorkspace', () => {
	it('flushes a draft before the 700ms delay when an internal tab is clicked, retaining it on failure', async () => {
		apiMock.mockRejectedValueOnce(new Error('offline'));
		render(
			<>
				<Link href="/my-space/teaching/class-1?tab=cp">Điểm CP</Link>
				<ClassNotesAdminWorkspace classId="class-1" initial={[note()]} />
			</>,
		);
		fireEvent.change(screen.getByDisplayValue('Tuần 1'), { target: { value: 'Bản sửa cần giữ' } });
		fireEvent.click(screen.getByRole('link', { name: 'Điểm CP' }));
		await act(async () => {});
		expect(apiMock).toHaveBeenCalledWith(
			expect.stringContaining('/notes/note-1'),
			expect.objectContaining({
				body: JSON.stringify({ title: 'Bản sửa cần giữ', html: note().draftHtml }),
			}),
		);
		expect(screen.getByDisplayValue('Bản sửa cần giữ')).toBeInTheDocument();
		expect(screen.getByRole('dialog', { name: 'Thay đổi chưa lưu' })).toBeVisible();
		fireEvent.click(screen.getByRole('button', { name: 'Ở lại' }));
		apiMock.mockResolvedValueOnce(note({ draftTitle: 'Bản sửa cần giữ' }));
		fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
		await act(async () => {});
		expect(screen.getByText('Đã lưu')).toBeInTheDocument();
	});

	it('saves newer edits after a slow request before selecting another note', async () => {
		let finish!: (value: TeachingClassNoteRecord) => void;
		apiMock.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					finish = resolve;
				}),
		);
		apiMock.mockResolvedValueOnce(note({ draftTitle: 'Mới nhất' }));
		render(
			<ClassNotesAdminWorkspace
				classId="class-1"
				initial={[note(), note({ id: 'note-2', draftTitle: 'Tuần 2' })]}
			/>,
		);
		fireEvent.change(screen.getByDisplayValue('Tuần 1'), { target: { value: 'Bản đang gửi' } });
		await act(async () => {
			await vi.advanceTimersByTimeAsync(700);
		});
		fireEvent.change(screen.getByDisplayValue('Bản đang gửi'), { target: { value: 'Mới nhất' } });
		fireEvent.click(screen.getByRole('button', { name: /Tuần 2/ }));
		expect(screen.getByDisplayValue('Mới nhất')).toBeInTheDocument();
		await act(async () => {
			finish(note({ draftTitle: 'Bản đang gửi' }));
		});
		expect(apiMock).toHaveBeenLastCalledWith(
			expect.stringContaining('/notes/note-1'),
			expect.objectContaining({
				body: JSON.stringify({ title: 'Mới nhất', html: note().draftHtml }),
			}),
		);
		expect(screen.getByDisplayValue('Tuần 2')).toBeInTheDocument();
	});
	beforeEach(() => {
		vi.useFakeTimers();
		apiMock.mockReset();
		vi.stubGlobal(
			'confirm',
			vi.fn(() => true),
		);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it('creates a new note and selects it without writing the initial draft again', async () => {
		const created = note({ id: 'note-2', draftTitle: 'Mục mới', draftHtml: '', displayOrder: 1 });
		apiMock.mockResolvedValueOnce(created);
		render(<ClassNotesAdminWorkspace classId="class-1" initial={[note()]} />);

		fireEvent.click(screen.getByRole('button', { name: /thêm/i }));
		await act(async () => {});
		expect(apiMock).toHaveBeenCalledWith(
			'/api/admin/teaching/classes/class-1/notes',
			expect.objectContaining({ method: 'POST' }),
		);
		expect(screen.getByDisplayValue('Mục mới')).toBeInTheDocument();

		await act(async () => {
			await vi.advanceTimersByTimeAsync(800);
		});
		expect(apiMock).toHaveBeenCalledTimes(1);
	});

	it('autosaves title and content after editing stops', async () => {
		const saved = note({ draftTitle: 'Tuần 2', draftHtml: '<p>Nội dung mới</p>' });
		apiMock.mockResolvedValueOnce(saved);
		render(<ClassNotesAdminWorkspace classId="class-1" initial={[note()]} />);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(1);
		});
		fireEvent.change(screen.getByDisplayValue('Tuần 1'), { target: { value: 'Tuần 2' } });
		fireEvent.change(screen.getByLabelText('Nội dung note'), {
			target: { value: '<p>Nội dung mới</p>' },
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(700);
		});

		expect(apiMock).toHaveBeenCalledWith(
			'/api/admin/teaching/classes/class-1/notes/note-1',
			expect.objectContaining({
				method: 'PATCH',
				body: JSON.stringify({ title: 'Tuần 2', html: '<p>Nội dung mới</p>' }),
			}),
		);
		expect(screen.getByText('Đã lưu')).toBeInTheDocument();
	});

	it('flushes the current draft before publishing', async () => {
		const saved = note({ draftTitle: 'Đã sửa', draftHtml: '<p>Nội dung đã sửa</p>' });
		const published = note({
			...saved,
			publishedTitle: 'Đã sửa',
			publishedHtml: '<p>Nội dung đã sửa</p>',
			publishedAt: '2026-08-26T01:00:00.000Z',
			status: 'PUBLISHED',
		});
		apiMock.mockResolvedValueOnce(saved).mockResolvedValueOnce(published);
		render(<ClassNotesAdminWorkspace classId="class-1" initial={[note()]} />);

		fireEvent.change(screen.getByDisplayValue('Tuần 1'), { target: { value: 'Đã sửa' } });
		fireEvent.change(screen.getByLabelText('Nội dung note'), {
			target: { value: '<p>Nội dung đã sửa</p>' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Xuất bản' }));
		await act(async () => {});

		expect(apiMock).toHaveBeenNthCalledWith(
			1,
			'/api/admin/teaching/classes/class-1/notes/note-1',
			expect.objectContaining({
				method: 'PATCH',
				body: JSON.stringify({ title: 'Đã sửa', html: '<p>Nội dung đã sửa</p>' }),
			}),
		);
		expect(apiMock).toHaveBeenNthCalledWith(
			2,
			'/api/admin/teaching/classes/class-1/notes/note-1/publish',
			{ method: 'POST' },
		);
	});

	it('contains network failures and reports a save error', async () => {
		apiMock.mockRejectedValueOnce(new Error('network down'));
		render(<ClassNotesAdminWorkspace classId="class-1" initial={[note()]} />);

		fireEvent.click(screen.getByRole('button', { name: 'Xuất bản' }));
		await act(async () => {});
		expect(screen.getByText('Lưu lỗi')).toBeInTheDocument();
	});
});
