import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ThumbnailUpload from './ThumbnailUpload';

vi.mock('./ImageCropModal', () => ({
	default: ({
		onCancel,
		onCropDone,
	}: {
		onCancel: () => void;
		onCropDone: (file: File) => void;
	}) => (
		<div>
			<button type="button" onClick={onCancel}>
				Huỷ cắt
			</button>
			<button
				type="button"
				onClick={() => onCropDone(new File(['webp'], 'cropped.webp', { type: 'image/webp' }))}
			>
				Áp dụng
			</button>
		</div>
	),
}));

function chooseFile() {
	const input = document.querySelector('input[type="file"]') as HTMLInputElement;
	const file = new File(['png'], 'cover.png', { type: 'image/png' });
	Object.defineProperty(input, 'files', { configurable: true, value: [file] });
	fireEvent.change(input);
	return input;
}

describe('ThumbnailUpload', () => {
	beforeEach(() => {
		vi.stubGlobal('fetch', vi.fn());
		URL.createObjectURL = vi.fn(() => 'blob:preview');
		URL.revokeObjectURL = vi.fn();
	});

	it('keeps the file input after an image is chosen and can replace it', () => {
		render(<ThumbnailUpload value="/uploads/old.webp" onChange={vi.fn()} />);
		const input = document.querySelector('input[type="file"]');
		expect(input).not.toBeNull();
		const click = vi.spyOn(input as HTMLInputElement, 'click');
		fireEvent.click(screen.getByRole('button', { name: 'Đổi ảnh' }));
		expect(click).toHaveBeenCalled();
	});

	it('leaves the saved image unchanged when cropping is cancelled', async () => {
		const onChange = vi.fn();
		render(<ThumbnailUpload value="/uploads/old.webp" onChange={onChange} />);
		chooseFile();
		fireEvent.click(await screen.findByRole('button', { name: 'Huỷ cắt' }));
		expect(onChange).not.toHaveBeenCalled();
		expect(screen.queryByRole('button', { name: 'Huỷ cắt' })).not.toBeInTheDocument();
		expect(screen.getByRole('img', { name: 'Thumbnail preview' })).toHaveAttribute(
			'src',
			'/uploads/old.webp',
		);
	});

	it('reports an upload error and does not replace the image', async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: false,
			status: 400,
			json: async () => ({ ok: false, error: 'Tệp không hợp lệ' }),
		} as Response);
		const onChange = vi.fn();
		const onUploadingChange = vi.fn();
		render(<ThumbnailUpload value="" onChange={onChange} onUploadingChange={onUploadingChange} />);
		chooseFile();
		fireEvent.click(await screen.findByRole('button', { name: 'Áp dụng' }));
		expect(await screen.findByRole('alert')).toHaveTextContent('Tệp không hợp lệ');
		expect(onChange).not.toHaveBeenCalled();
		expect(onUploadingChange).toHaveBeenCalledWith(true);
		expect(onUploadingChange).toHaveBeenLastCalledWith(false);
	});

	it('publishes the uploaded URL only after the request succeeds', async () => {
		let resolveJson: (value: unknown) => void = () => {};
		vi.mocked(fetch).mockReturnValue(
			new Promise((resolve) => {
				resolveJson = () =>
					resolve({
						ok: true,
						json: async () => ({ ok: true, data: { url: '/uploads/new.webp' } }),
					} as Response);
			}),
		);
		const onChange = vi.fn();
		const onUploadingChange = vi.fn();
		render(
			<ThumbnailUpload
				value="/uploads/old.webp"
				onChange={onChange}
				onUploadingChange={onUploadingChange}
			/>,
		);
		chooseFile();
		fireEvent.click(await screen.findByRole('button', { name: 'Áp dụng' }));
		expect(await screen.findByRole('status')).toHaveTextContent('Đang tải ảnh…');
		expect(onChange).not.toHaveBeenCalled();
		resolveJson(undefined);
		await waitFor(() => expect(onChange).toHaveBeenCalledWith('/uploads/new.webp'));
		expect(onUploadingChange).toHaveBeenLastCalledWith(false);
	});
});
