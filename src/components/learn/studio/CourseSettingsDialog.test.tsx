import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { LearnCourseMeta } from '@/features/learn/types';

import CourseSettingsDialog from './CourseSettingsDialog';

vi.mock('@/components/forms/ThumbnailUpload', () => ({
	default: ({
		value,
		onChange,
		onUploadingChange,
	}: {
		value: string;
		onChange: (url: string) => void;
		onUploadingChange?: (uploading: boolean) => void;
	}) => (
		<div>
			<p>Ảnh hiện tại: {value || 'mặc định'}</p>
			<button type="button" onClick={() => onChange('/uploads/cover.webp')}>
				Chọn ảnh thử
			</button>
			<button type="button" onClick={() => onChange('')}>
				Gỡ ảnh
			</button>
			<button type="button" onClick={() => onUploadingChange?.(true)}>
				Bắt đầu tải
			</button>
		</div>
	),
}));

const course: LearnCourseMeta = {
	id: 'course-1',
	slug: 'demo',
	title: 'Khóa demo',
	subtitle: '',
	description: '',
	category: '',
	level: 'BASIC',
	status: 'DRAFT',
	thumbnailUrl: null,
	updatedAt: '2026-10-19T00:00:00.000Z',
};

describe('CourseSettingsDialog thumbnails', () => {
	it('saves a new cover only when Lưu is pressed', () => {
		const onSave = vi.fn(async () => {});
		const onClose = vi.fn();
		render(
			<CourseSettingsDialog course={course} onSave={onSave} onClose={onClose} onDelete={vi.fn()} />,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Chọn ảnh thử' }));
		fireEvent.click(screen.getByRole('button', { name: 'Lưu' }));
		expect(onSave).toHaveBeenCalledWith(
			expect.objectContaining({ thumbnailUrl: '/uploads/cover.webp' }),
		);
		expect(onClose).not.toHaveBeenCalled();
	});

	it('discards an unsaved cover when the dialog is cancelled', async () => {
		const onSave = vi.fn(async () => {});
		const onClose = vi.fn();
		render(
			<CourseSettingsDialog
				course={{ ...course, thumbnailUrl: '/uploads/old.webp' }}
				onSave={onSave}
				onClose={onClose}
				onDelete={vi.fn()}
			/>,
		);

		expect(screen.getByText('Ảnh hiện tại: /uploads/old.webp')).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Chọn ảnh thử' }));
		fireEvent.click(screen.getByRole('button', { name: 'Hủy' }));
		fireEvent.click(await screen.findByRole('button', { name: 'Bỏ' }));
		expect(onSave).not.toHaveBeenCalled();
		await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
	});

	it('returns to the default artwork when the cover is removed and saved', () => {
		const onSave = vi.fn(async () => {});
		render(
			<CourseSettingsDialog
				course={{ ...course, thumbnailUrl: '/uploads/old.webp' }}
				onSave={onSave}
				onClose={vi.fn()}
				onDelete={vi.fn()}
			/>,
		);
		fireEvent.click(screen.getByRole('button', { name: 'Gỡ ảnh' }));
		fireEvent.click(screen.getByRole('button', { name: 'Lưu' }));
		expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ thumbnailUrl: null }));
	});

	it('blocks saving while an upload is in progress', () => {
		const onSave = vi.fn(async () => {});
		render(
			<CourseSettingsDialog course={course} onSave={onSave} onClose={vi.fn()} onDelete={vi.fn()} />,
		);
		fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu tải' }));
		const save = screen.getByRole('button', { name: 'Lưu' });
		expect(save).toBeDisabled();
		fireEvent.click(save);
		expect(onSave).not.toHaveBeenCalled();
	});
});
