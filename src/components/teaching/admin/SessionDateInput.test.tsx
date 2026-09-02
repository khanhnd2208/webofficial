import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SessionDateInput } from './SessionDateInput';

describe('SessionDateInput', () => {
	it('pastes compact and slash dates then commits ISO', () => {
		const onCommit = vi.fn();
		render(<SessionDateInput weekNumber={1} value={null} onCommit={onCommit} />);
		const day = screen.getByLabelText('Ngày học tuần 1');
		fireEvent.paste(day, { clipboardData: { getData: () => '05092026' } });
		expect(onCommit).toHaveBeenCalledWith('2026-09-05');
	});

	it('rejects a non-calendar date immediately', () => {
		const onCommit = vi.fn();
		render(<SessionDateInput weekNumber={2} value={null} onCommit={onCommit} />);
		fireEvent.change(screen.getByLabelText('Ngày học tuần 2'), { target: { value: '31' } });
		fireEvent.change(screen.getByLabelText('Tháng học tuần 2'), { target: { value: '02' } });
		fireEvent.change(screen.getByLabelText('Năm học tuần 2'), { target: { value: '2026' } });
		expect(onCommit).not.toHaveBeenCalled();
		expect(screen.getByText(/không tồn tại/i)).toBeInTheDocument();
	});
});
