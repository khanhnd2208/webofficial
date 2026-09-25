import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SessionDateInput } from './SessionDateInput';

function open(
	value: string | null = '2026-09-01',
	onCommit = vi.fn().mockResolvedValue(undefined),
) {
	render(<SessionDateInput weekNumber={1} value={value} onCommit={onCommit} />);
	const trigger = screen.getByRole('button', { name: 'Sửa ngày tuần 1' });
	fireEvent.click(trigger);
	return { trigger, onCommit };
}
describe('calendar-first session date', () => {
	it('shows a calendar immediately, selects and saves without numeric input', async () => {
		const { onCommit, trigger } = open();
		expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: '1/9/2026' })).toHaveFocus();
		fireEvent.click(screen.getByRole('button', { name: '12/9/2026' }));
		expect(onCommit).toHaveBeenCalledWith('2026-09-12');
		await waitFor(() => {
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
			expect(trigger).toHaveFocus();
		});
	});
	it('opens an empty date on today and marks today', () => {
		open(null);
		expect(document.querySelector('[aria-current="date"]')).toHaveFocus();
	});
	it.each(['2024-02-01', '2026-02-01'])('only offers valid days in %s', (value) => {
		open(value);
		const leap = value.startsWith('2024');
		expect(screen.queryByRole('button', { name: `29/2/${leap ? 2024 : 2026}` }) !== null).toBe(
			leap,
		);
		expect(screen.queryByRole('button', { name: /30\/2/ })).not.toBeInTheDocument();
	});
	it('moves across year boundaries and supports keyboard navigation', () => {
		const { trigger, onCommit } = open('2026-12-31');
		fireEvent.keyDown(screen.getByRole('button', { name: '31/12/2026' }), { key: 'ArrowRight' });
		expect(screen.getByRole('button', { name: '1/1/2027' })).toHaveFocus();
		fireEvent.click(screen.getByRole('button', { name: 'Tháng trước' }));
		expect(screen.getByRole('group', { name: 'Tháng 12 / 2026' })).toBeVisible();
		fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
		expect(trigger).toHaveFocus();
		expect(onCommit).not.toHaveBeenCalled();
	});
	it('retains a failed selection, retries, and rejects duplicate clicks', async () => {
		const onCommit = vi
			.fn()
			.mockRejectedValueOnce(new Error('offline'))
			.mockResolvedValue(undefined);
		open('2026-09-01', onCommit);
		const day = screen.getByRole('button', { name: '12/9/2026' });
		fireEvent.click(day);
		fireEvent.click(day);
		expect(onCommit).toHaveBeenCalledTimes(1);
		expect(await screen.findByRole('alert')).toBeVisible();
		expect(day).toHaveAttribute('aria-pressed', 'true');
		fireEvent.click(screen.getByRole('button', { name: 'Thử lại lưu ngày' }));
		expect(onCommit).toHaveBeenLastCalledWith('2026-09-12');
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
	});
	it('clears explicitly', async () => {
		const { onCommit } = open();
		fireEvent.click(screen.getByRole('button', { name: 'Xóa ngày tuần 1' }));
		expect(onCommit).toHaveBeenCalledWith(null);
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
	});
});
