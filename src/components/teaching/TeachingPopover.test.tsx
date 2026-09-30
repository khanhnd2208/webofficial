import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TeachingPopover, TeachingPopoverRoot } from '@/components/teaching/TeachingPopover';

describe('TeachingPopover', () => {
	it('portals outside clipping containers and supports keyboard navigation', () => {
		render(
			<div data-testid="clipping" style={{ overflow: 'hidden' }}>
				<TeachingPopover
					trigger={({ toggle, triggerRef, triggerProps }) => (
						<button ref={triggerRef} {...triggerProps} onClick={toggle}>
							Menu
						</button>
					)}
				>
					<button>Sửa</button>
					<button>Xóa</button>
				</TeachingPopover>
			</div>,
		);
		const trigger = screen.getByRole('button', { name: 'Menu' });
		fireEvent.click(trigger);
		expect(screen.getByTestId('clipping')).not.toContainElement(screen.getByRole('menu'));
		expect(screen.getByRole('button', { name: 'Sửa' })).toHaveFocus();
		fireEvent.keyDown(screen.getByRole('button', { name: 'Sửa' }), { key: 'ArrowDown' });
		expect(screen.getByRole('button', { name: 'Xóa' })).toHaveFocus();
		fireEvent.keyDown(screen.getByRole('button', { name: 'Xóa' }), { key: 'Escape' });
		expect(trigger).toHaveFocus();
	});
	it('closes on outside click and Escape', () => {
		render(
			<div>
				<TeachingPopover
					trigger={({ toggle, triggerRef, triggerProps }) => (
						<button ref={triggerRef} {...triggerProps} onClick={toggle}>
							Quản lý
						</button>
					)}
				>
					<button type="button">Học viên</button>
				</TeachingPopover>
				<button type="button">Bên ngoài</button>
			</div>,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Quản lý' }));
		expect(screen.getByRole('button', { name: 'Học viên' })).toBeInTheDocument();

		fireEvent.pointerDown(screen.getByRole('button', { name: 'Bên ngoài' }));
		expect(screen.queryByRole('button', { name: 'Học viên' })).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: 'Quản lý' }));
		fireEvent.keyDown(document, { key: 'Escape' });
		expect(screen.queryByRole('button', { name: 'Học viên' })).not.toBeInTheDocument();
	});

	it('keeps a nested root on the same exclusive registry', () => {
		render(
			<TeachingPopoverRoot>
				<TeachingPopover
					trigger={({ toggle, triggerRef, triggerProps }) => (
						<button ref={triggerRef} {...triggerProps} onClick={toggle}>
							Quản lý
						</button>
					)}
				>
					<button type="button">Học viên</button>
				</TeachingPopover>
				<TeachingPopoverRoot>
					<TeachingPopover
						trigger={({ toggle, triggerRef, triggerProps }) => (
							<button ref={triggerRef} {...triggerProps} onClick={toggle}>
								Thiết lập
							</button>
						)}
					>
						<button type="button">Khóa bảng</button>
					</TeachingPopover>
				</TeachingPopoverRoot>
			</TeachingPopoverRoot>,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Quản lý' }));
		expect(screen.getByRole('button', { name: 'Học viên' })).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Thiết lập' }));
		expect(screen.queryByRole('button', { name: 'Học viên' })).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Khóa bảng' })).toBeInTheDocument();
	});
});
