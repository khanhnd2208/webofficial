import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ThumbnailUpload from './ThumbnailUpload';

describe('ThumbnailUpload crop dialog', () => {
	beforeEach(() => {
		URL.createObjectURL = vi.fn(() => 'blob:preview');
		URL.revokeObjectURL = vi.fn();
	});

	it('returns focus to Đổi ảnh after the crop dialog closes', async () => {
		render(<ThumbnailUpload value="/uploads/old.webp" onChange={vi.fn()} />);
		const change = screen.getByRole('button', { name: 'Đổi ảnh' });
		fireEvent.click(change);

		const input = document.querySelector('input[type="file"]') as HTMLInputElement;
		const file = new File(['png'], 'cover.png', { type: 'image/png' });
		Object.defineProperty(input, 'files', { configurable: true, value: [file] });
		fireEvent.change(input);

		const crop = await screen.findByRole('dialog', { name: 'Chỉnh sửa ảnh' });
		change.blur();
		fireEvent.click(screen.getByRole('button', { name: 'Huỷ' }));

		expect(crop).not.toBeInTheDocument();
		expect(change).toHaveFocus();
	});
});
