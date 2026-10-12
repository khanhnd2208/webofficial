import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AdminConfirmDialog } from './AdminConfirmDialog';

describe('AdminConfirmDialog', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('keeps a destructive confirmation disabled for the requested delay', async () => {
		vi.useFakeTimers();
		const onConfirm = vi.fn();

		render(
			<AdminConfirmDialog
				open
				title="Xóa bộ thẻ"
				description="Không thể hoàn tác."
				confirmLabel="Xóa vĩnh viễn"
				confirmDelaySeconds={3}
				onConfirm={onConfirm}
				onClose={vi.fn()}
			/>,
		);

		const lockedButton = screen.getByRole('button', { name: 'Xóa vĩnh viễn (3 giây)' });
		expect(lockedButton).toBeDisabled();
		fireEvent.click(lockedButton);
		expect(onConfirm).not.toHaveBeenCalled();

		await act(() => vi.advanceTimersByTimeAsync(2_999));
		expect(screen.getByTestId('admin-confirm-accept')).toBeDisabled();

		await act(() => vi.advanceTimersByTimeAsync(1));
		const unlockedButton = screen.getByRole('button', { name: 'Xóa vĩnh viễn' });
		expect(unlockedButton).toBeEnabled();
		fireEvent.click(unlockedButton);
		expect(onConfirm).toHaveBeenCalledOnce();
	});
});
