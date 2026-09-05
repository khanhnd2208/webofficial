import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SessionDateInput } from './SessionDateInput';

describe('SessionDateInput', () => {
	it('pastes compact and slash dates then commits ISO', () => {
		const onCommit = vi.fn();
		render(<SessionDateInput weekNumber={1} value={null} onCommit={onCommit} />);
		fireEvent.click(screen.getByRole('button', { name: 'Sửa ngày tuần 1' }));
		const day = screen.getByLabelText('Ngày học tuần 1');
		fireEvent.paste(day, { clipboardData: { getData: () => '05092026' } });
		expect(onCommit).toHaveBeenCalledWith('2026-09-05');
	});

	it('rejects a non-calendar date immediately', () => {
		const onCommit = vi.fn();
		render(<SessionDateInput weekNumber={2} value={null} onCommit={onCommit} />);
		fireEvent.click(screen.getByRole('button', { name: 'Sửa ngày tuần 2' }));
		fireEvent.change(screen.getByLabelText('Ngày học tuần 2'), { target: { value: '31' } });
		fireEvent.change(screen.getByLabelText('Tháng học tuần 2'), { target: { value: '02' } });
		fireEvent.change(screen.getByLabelText('Năm học tuần 2'), { target: { value: '2026' } });
		expect(onCommit).not.toHaveBeenCalled();
		expect(screen.getByText(/không tồn tại/i)).toBeInTheDocument();
	});
});

it.each(['29022024', '29/02/2024'])('accepts leap dates pasted as %s', async (text) => {
	const onCommit = vi.fn().mockResolvedValue(undefined);
	render(<SessionDateInput weekNumber={1} value={null} onCommit={onCommit} />);
	fireEvent.click(screen.getByRole('button', { name: 'Sửa ngày tuần 1' }));
	fireEvent.paste(screen.getByLabelText('Ngày học tuần 1'), {
		clipboardData: { getData: () => text },
	});
	expect(onCommit).toHaveBeenCalledWith('2024-02-29');
});

it('rejects invalid pasted text without changing the saved date', () => {
	const onCommit = vi.fn();
	render(<SessionDateInput weekNumber={1} value="2026-09-01" onCommit={onCommit} />);
	fireEvent.click(screen.getByRole('button', { name: 'Sửa ngày tuần 1' }));
	fireEvent.paste(screen.getByLabelText('Ngày học tuần 1'), {
		clipboardData: { getData: () => '31/02/2026' },
	});
	expect(screen.getByRole('alert')).toBeVisible();
	expect(onCommit).not.toHaveBeenCalled();
});

it('cancels a partial date with Escape without saving', () => {
	const onCommit = vi.fn();
	render(<SessionDateInput weekNumber={1} value="2026-09-01" onCommit={onCommit} />);
	const trigger = screen.getByRole('button', { name: 'Sửa ngày tuần 1' });
	fireEvent.click(trigger);
	const day = screen.getByLabelText('Ngày học tuần 1');
	fireEvent.change(day, { target: { value: '2' } });
	fireEvent.keyDown(day, { key: 'Escape' });
	expect(onCommit).not.toHaveBeenCalled();
	expect(trigger).toHaveFocus();
	expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('retries a failed date and prevents duplicate submissions while saving', async () => {
	const onCommit = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
	render(<SessionDateInput weekNumber={1} value="2026-09-01" onCommit={onCommit} />);
	fireEvent.click(screen.getByRole('button', { name: 'Sửa ngày tuần 1' }));
	const day = screen.getByLabelText('Ngày học tuần 1');
	fireEvent.change(day, { target: { value: '12' } });
	fireEvent.keyDown(day, { key: 'Enter' });
	fireEvent.keyDown(day, { key: 'Enter' });
	expect(onCommit).toHaveBeenCalledTimes(1);
	await screen.findByRole('button', { name: 'Thử lại lưu ngày' });
	expect(day).toHaveValue('12');
	fireEvent.click(screen.getByRole('button', { name: 'Thử lại lưu ngày' }));
	expect(onCommit).toHaveBeenLastCalledWith('2026-09-12');
});

it('clears the date explicitly', async () => {
	const onCommit = vi.fn().mockResolvedValue(undefined);
	render(<SessionDateInput weekNumber={1} value="2026-09-01" onCommit={onCommit} />);
	fireEvent.click(screen.getByRole('button', { name: 'Sửa ngày tuần 1' }));
	fireEvent.click(screen.getByRole('button', { name: 'Xóa ngày tuần 1' }));
	expect(onCommit).toHaveBeenCalledWith(null);
});
