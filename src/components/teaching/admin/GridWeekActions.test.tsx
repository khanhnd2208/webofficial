import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GridWeekActions } from './GridWeekActions';

describe('week controls', () => {
	it.each(['điểm danh', 'CP'] as const)(
		'offers supported lifecycle actions for %s without a menu',
		(kind) => {
			const onLifecycle = vi.fn();
			const props = {
				weekNumber: 1,
				kind,
				open: false,
				finalized: false,
				cancelled: false,
				busy: false,
				onLifecycle,
			};
			const { rerender } = render(<GridWeekActions {...props} />);
			expect(screen.getByText('Chưa chốt')).toBeVisible();
			expect(document.querySelector('[data-icon="lock"]')).toBeInTheDocument();
			expect(screen.queryByText('Tất cả có mặt')).not.toBeInTheDocument();
			fireEvent.click(screen.getByRole('button', { name: `Mở ${kind} tuần 1` }));
			expect(onLifecycle).toHaveBeenLastCalledWith('open');
			rerender(<GridWeekActions {...props} open />);
			expect(screen.getByText('Đang nhập')).toBeVisible();
			expect(document.querySelector('[data-icon="lock_open"]')).toBeInTheDocument();
			fireEvent.click(screen.getByRole('button', { name: `Tạm khóa ${kind} tuần 1` }));
			expect(onLifecycle).toHaveBeenLastCalledWith('park');
			rerender(<GridWeekActions {...props} />);
			expect(screen.getByText('Chưa chốt')).toBeVisible();
			fireEvent.click(screen.getByRole('button', { name: `Chốt ${kind} tuần 1` }));
			expect(onLifecycle).toHaveBeenLastCalledWith('finalize');
			rerender(<GridWeekActions {...props} finalized />);
			expect(screen.getByText('Đã chốt')).toBeVisible();
			expect(screen.queryByRole('menu')).not.toBeInTheDocument();
			fireEvent.click(screen.getByRole('button', { name: `Bỏ chốt ${kind} tuần 1` }));
			expect(onLifecycle).toHaveBeenLastCalledWith('unfinalize');
			rerender(<GridWeekActions {...props} cancelled />);
			expect(screen.getByText('Đã hủy')).toBeVisible();
			expect(screen.queryByRole('button')).not.toBeInTheDocument();
		},
	);
	it('does not expose a finalize action without a lifecycle callback', () => {
		render(
			<GridWeekActions
				weekNumber={1}
				kind="CP"
				open={false}
				finalized={false}
				cancelled={false}
				busy={false}
				onToggle={vi.fn()}
			/>,
		);
		fireEvent.click(screen.getByRole('button'));
		expect(screen.queryByRole('button', { name: /Chốt/ })).not.toBeInTheDocument();
	});
	it('disables both controls while transitioning', () => {
		render(
			<GridWeekActions
				weekNumber={1}
				kind="CP"
				open
				finalized={false}
				cancelled={false}
				busy
				onLifecycle={vi.fn()}
			/>,
		);
		screen.getAllByRole('button').forEach((button) => expect(button).toBeDisabled());
	});
});
