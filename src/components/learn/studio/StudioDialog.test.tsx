import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StudioDialog from './StudioDialog';

describe('Studio modal surfaces', () => {
	it('keeps every close path blocked while a write is in progress', () => {
		const close = vi.fn();
		render(
			<StudioDialog title="Đang nhập" busy onClose={close}>
				<p>Nội dung</p>
			</StudioDialog>,
		);
		const dialog = screen.getByRole('dialog', { name: 'Đang nhập' });
		fireEvent.click(dialog);
		fireEvent(dialog, new Event('cancel', { bubbles: true, cancelable: true }));
		fireEvent.click(screen.getByRole('button', { name: 'Đóng' }));
		expect(close).not.toHaveBeenCalled();
	});
});
