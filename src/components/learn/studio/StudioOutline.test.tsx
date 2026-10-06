import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { LearnStudioLesson, LearnStudioSection } from '@/features/learn/types';

import StudioOutline, { type OutlineActions } from './StudioOutline';

function section(id: string, lessonId: string, patch: Partial<LearnStudioSection> = {}) {
	return {
		id,
		lessonId,
		type: 'READING',
		title: `Mục ${id}`,
		durationMinutes: null,
		summary: '',
		keyTakeaways: [],
		markdown: 'Nội dung',
		checkpoint: null,
		discussion: null,
		estimatedMinutes: 1,
		updatedAt: '2026-10-05T00:00:00.000Z',
		...patch,
	} satisfies LearnStudioSection;
}

const lessons: LearnStudioLesson[] = [
	{
		id: 'l1',
		title: 'Mở đầu',
		description: '',
		sections: [section('a', 'l1'), section('b', 'l1', { markdown: '' })],
	},
	{ id: 'l2', title: 'Chương hai', description: '', sections: [section('c', 'l2')] },
];

function actions(): OutlineActions {
	return {
		onSelect: vi.fn(),
		onRenameLesson: vi.fn(),
		onReorderLessons: vi.fn(),
		onReorderSections: vi.fn(),
		onPlaceSection: vi.fn(),
		onAddSection: vi.fn(),
		onDeleteLesson: vi.fn(),
		onDuplicateLesson: vi.fn(),
		onExportLesson: vi.fn(),
		onDuplicateSection: vi.fn(),
		onPreviewSection: vi.fn(),
		onDeleteSection: vi.fn(),
		onAddLesson: vi.fn(),
		onImport: vi.fn(),
	};
}

const lessonToggle = (name: RegExp) => screen.getByRole('button', { name });

describe('StudioOutline', () => {
	beforeEach(() => window.localStorage.clear());

	it('opens only the lesson being edited and summarises the others', () => {
		render(<StudioOutline courseId="c1" lessons={lessons} selectedId="a" actions={actions()} />);
		expect(lessonToggle(/^Bài 1: Mở đầu, 2 mục, 1 cần xem$/)).toHaveAttribute(
			'aria-expanded',
			'true',
		);
		expect(lessonToggle(/^Bài 2: Chương hai/)).toHaveAttribute('aria-expanded', 'false');
		expect(screen.getByRole('button', { name: 'Mục a' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Mục c' })).not.toBeInTheDocument();
		expect(screen.getByText('Trống')).toBeInTheDocument();
	});

	it('remembers which lessons are open for the course', () => {
		const { unmount } = render(
			<StudioOutline courseId="c1" lessons={lessons} selectedId="a" actions={actions()} />,
		);
		fireEvent.click(lessonToggle(/^Bài 2:/));
		expect(screen.getByRole('button', { name: 'Mục c' })).toBeInTheDocument();
		unmount();

		render(<StudioOutline courseId="c1" lessons={lessons} selectedId="a" actions={actions()} />);
		expect(lessonToggle(/^Bài 2:/)).toHaveAttribute('aria-expanded', 'true');
	});

	it('collapses and expands every lesson at once', () => {
		render(<StudioOutline courseId="c1" lessons={lessons} selectedId="a" actions={actions()} />);
		fireEvent.click(screen.getByRole('button', { name: /Mở tất cả/ }));
		expect(lessonToggle(/^Bài 2:/)).toHaveAttribute('aria-expanded', 'true');
		fireEvent.click(screen.getByRole('button', { name: /Thu gọn/ }));
		expect(lessonToggle(/^Bài 2:/)).toHaveAttribute('aria-expanded', 'false');
		expect(lessonToggle(/^Bài 1:/)).toHaveAttribute('aria-expanded', 'true');
	});

	it('renames a lesson from its menu, and Esc cancels', () => {
		const handlers = actions();
		render(<StudioOutline courseId="c1" lessons={lessons} selectedId="a" actions={handlers} />);
		fireEvent.click(screen.getByRole('button', { name: 'Thao tác bài 1' }));
		fireEvent.click(screen.getByRole('menuitem', { name: 'Đổi tên' }));
		const input = screen.getByRole('textbox', { name: 'Tên bài 1' });
		fireEvent.change(input, { target: { value: 'Giới thiệu' } });
		fireEvent.keyDown(input, { key: 'Escape' });
		expect(handlers.onRenameLesson).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole('button', { name: 'Thao tác bài 1' }));
		fireEvent.click(screen.getByRole('menuitem', { name: 'Đổi tên' }));
		const again = screen.getByRole('textbox', { name: 'Tên bài 1' });
		fireEvent.change(again, { target: { value: 'Giới thiệu' } });
		fireEvent.blur(again);
		expect(handlers.onRenameLesson).toHaveBeenCalledWith('l1', 'Giới thiệu');
	});

	it('moves, duplicates and deletes from the menus without dragging', () => {
		const handlers = actions();
		render(<StudioOutline courseId="c1" lessons={lessons} selectedId="a" actions={handlers} />);

		fireEvent.click(screen.getByRole('button', { name: 'Thao tác bài 1' }));
		fireEvent.click(screen.getByRole('menuitem', { name: 'Xuống dưới' }));
		expect(handlers.onReorderLessons).toHaveBeenCalledWith(['l2', 'l1']);

		fireEvent.click(screen.getByRole('button', { name: 'Thao tác mục: Mục a' }));
		const menu = screen.getByRole('menu');
		expect(within(menu).getByRole('menuitem', { name: 'Lên trên' })).toBeDisabled();
		fireEvent.click(within(menu).getByRole('menuitem', { name: /Chuyển sang Bài 2/ }));
		expect(handlers.onPlaceSection).toHaveBeenCalledWith('a', 'l2', null);

		fireEvent.click(screen.getByRole('button', { name: 'Thao tác mục: Mục a' }));
		fireEvent.click(screen.getByRole('menuitem', { name: 'Nhân bản mục' }));
		expect(handlers.onDuplicateSection).toHaveBeenCalledWith('a');

		fireEvent.click(screen.getByRole('button', { name: 'Thêm mục vào bài 1' }));
		fireEvent.click(screen.getByRole('menuitem', { name: /Phản biện/ }));
		expect(handlers.onAddSection).toHaveBeenCalledWith('l1', 'DISCUSSION');
	});

	it('closes a menu with Esc and gives focus back to its button', () => {
		render(<StudioOutline courseId="c1" lessons={lessons} selectedId="a" actions={actions()} />);
		const trigger = screen.getByRole('button', { name: 'Thao tác bài 1' });
		fireEvent.click(trigger);
		expect(screen.getByRole('menu')).toBeInTheDocument();
		fireEvent.keyDown(document, { key: 'Escape' });
		expect(screen.queryByRole('menu')).not.toBeInTheDocument();
		expect(trigger).toHaveFocus();
	});
});
