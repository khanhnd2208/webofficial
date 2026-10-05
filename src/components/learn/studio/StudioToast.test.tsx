import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import StudioToast from './StudioToast';

describe('StudioToast', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it('offers undo, then closes after 8 seconds', async () => {
		const onAction = vi.fn();
		const onClose = vi.fn();
		render(<StudioToast message='Đã xóa mục "Mục 1"' onAction={onAction} onClose={onClose} />);

		fireEvent.click(screen.getByRole('button', { name: 'Hoàn tác' }));
		expect(onAction).toHaveBeenCalledOnce();

		await act(async () => {
			await vi.advanceTimersByTimeAsync(7_999);
		});
		expect(onClose).not.toHaveBeenCalled();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(1);
		});
		expect(onClose).toHaveBeenCalledOnce();
	});

	it('pauses the timer while hovered and closes on Escape', async () => {
		const onClose = vi.fn();
		render(<StudioToast message="Đã xóa câu 2" onAction={vi.fn()} onClose={onClose} />);
		const toast = screen.getByRole('status');

		fireEvent.mouseEnter(toast);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(20_000);
		});
		expect(onClose).not.toHaveBeenCalled();

		fireEvent.mouseLeave(toast);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(8_000);
		});
		expect(onClose).toHaveBeenCalledOnce();
	});

	it('closes on Escape', () => {
		const onClose = vi.fn();
		render(<StudioToast message="Đã xóa câu 3" onClose={onClose} />);
		fireEvent.keyDown(document, { key: 'Escape' });
		expect(onClose).toHaveBeenCalledOnce();
	});
});
