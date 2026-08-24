import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { OutlineCourseMenu, OutlineTestMenu, OutlineVocabMenu } from './OutlineEditControls';

vi.mock('./EditModeContext', () => ({
	useOptionalEditMode: () => ({
		enabled: true,
		detachTest: vi.fn(),
		detachVocab: vi.fn(),
	}),
	useEditMode: () => ({
		enabled: true,
		setPicker: vi.fn(),
	}),
}));

describe('OutlineTestMenu', () => {
	it('renders the full action menu outside the clipped outline branch', () => {
		render(
			<div className="mc">
				<div className="mc-outline-branch-clip" data-testid="outline-clip" style={{ overflow: 'hidden', height: 40 }}>
					<OutlineTestMenu testId="test-1" placementId="place-1" />
				</div>
			</div>,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Thao tác' }));

		const menu = screen.getByRole('menu', { name: 'Thao tác bài kiểm tra' });
		expect(menu).toBeVisible();
		expect(screen.getByRole('menuitem', { name: 'Sửa trong studio' })).toBeVisible();
		expect(screen.getByRole('menuitem', { name: 'Gỡ khỏi mục lục' })).toBeVisible();
		expect(menu.closest('[data-testid="outline-clip"]')).toBeNull();
	});

	it('closes the previous outline menu when another row menu opens', () => {
		render(
			<div className="mc">
				<OutlineTestMenu testId="test-1" />
				<OutlineTestMenu testId="test-2" />
			</div>,
		);

		const triggers = screen.getAllByRole('button', { name: 'Thao tác' });
		fireEvent.click(triggers[0]!);
		expect(screen.getAllByRole('menu')).toHaveLength(1);
		fireEvent.click(triggers[1]!);
		expect(screen.getAllByRole('menu')).toHaveLength(1);
		expect(triggers[0]).toHaveAttribute('aria-expanded', 'false');
		expect(triggers[1]).toHaveAttribute('aria-expanded', 'true');
	});
});

describe('OutlineCourseMenu', () => {
	it('exposes course-level attach actions', () => {
		render(
			<div className="mc">
				<OutlineCourseMenu />
			</div>,
		);
		fireEvent.click(screen.getByRole('button', { name: 'Gắn vào toàn khóa' }));
		expect(screen.getByRole('menuitem', { name: 'Gắn bài kiểm tra (toàn khóa)' })).toBeVisible();
		expect(screen.getByRole('menuitem', { name: 'Gắn bộ từ vựng (toàn khóa)' })).toBeVisible();
	});
});

describe('OutlineVocabMenu', () => {
	it('exposes edit and detach actions', () => {
		render(
			<div className="mc">
				<OutlineVocabMenu assignmentId="as-1" vocabSetId="set-1" />
			</div>,
		);
		fireEvent.click(screen.getByRole('button', { name: 'Thao tác từ vựng' }));
		expect(screen.getByRole('menuitem', { name: 'Sửa trong studio' })).toHaveAttribute(
			'href',
			'/admin/my-class/vocabulary/set-1',
		);
		expect(screen.getByRole('menuitem', { name: 'Gỡ khỏi mục lục' })).toBeVisible();
	});
});
