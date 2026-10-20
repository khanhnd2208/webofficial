import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect, useRef, useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ImageCropModal from './ImageCropModal';

const filters: string[] = [];

function stubCanvas(toBlob: HTMLCanvasElement['toBlob']) {
	HTMLCanvasElement.prototype.getContext = vi.fn(() => {
		const ctx = {
			filter: '',
			imageSmoothingQuality: 'high',
			drawImage() {
				filters.push(ctx.filter);
			},
		};
		return ctx as unknown as CanvasRenderingContext2D;
	}) as unknown as typeof HTMLCanvasElement.prototype.getContext;
	HTMLCanvasElement.prototype.toBlob = toBlob;
}

function loadPreview() {
	const img = document.querySelector('img[alt="Crop preview"]') as HTMLImageElement;
	Object.defineProperty(img, 'width', { configurable: true, value: 400 });
	Object.defineProperty(img, 'height', { configurable: true, value: 225 });
	Object.defineProperty(img, 'naturalWidth', { configurable: true, value: 800 });
	Object.defineProperty(img, 'naturalHeight', { configurable: true, value: 450 });
	fireEvent.load(img);
}

function ParentDialog({
	onCropCancel,
	onParentClose,
}: {
	onCropCancel: () => void;
	onParentClose: () => void;
}) {
	const ref = useRef<HTMLDialogElement>(null);
	const [cropOpen, setCropOpen] = useState(true);
	const [parentOpen, setParentOpen] = useState(true);
	useEffect(() => {
		ref.current?.showModal();
	}, []);

	return (
		<>
			{parentOpen ? (
				<dialog
					ref={ref}
					aria-label="Thông tin khóa học"
					onCancel={(event) => {
						event.preventDefault();
						setParentOpen(false);
						onParentClose();
					}}
				>
					<p>Bản nháp khóa học</p>
				</dialog>
			) : (
				<p>Đã đóng thông tin</p>
			)}
			{cropOpen ? (
				<ImageCropModal
					src="blob:preview"
					onCropDone={vi.fn()}
					onCancel={() => {
						setCropOpen(false);
						onCropCancel();
					}}
				/>
			) : null}
		</>
	);
}

describe('ImageCropModal', () => {
	beforeEach(() => {
		filters.length = 0;
		stubCanvas((callback) => {
			callback?.(new Blob(['webp'], { type: 'image/webp' }));
		});
	});

	it('opens a named dialog and cancels only the crop', () => {
		const onCropCancel = vi.fn();
		const onParentClose = vi.fn();
		render(<ParentDialog onCropCancel={onCropCancel} onParentClose={onParentClose} />);

		const crop = screen.getByRole('dialog', { name: 'Chỉnh sửa ảnh' });
		expect(crop.parentElement).toBe(document.body);
		expect(screen.getByRole('dialog', { name: 'Thông tin khóa học' })).toBeInTheDocument();

		fireEvent(crop, new Event('cancel', { cancelable: true }));

		expect(onCropCancel).toHaveBeenCalledOnce();
		expect(onParentClose).not.toHaveBeenCalled();
		expect(screen.getByRole('dialog', { name: 'Thông tin khóa học' })).toBeInTheDocument();
		expect(screen.queryByRole('dialog', { name: 'Chỉnh sửa ảnh' })).not.toBeInTheDocument();
	});

	it('records brightness and contrast on the exported canvas', async () => {
		const onCropDone = vi.fn();
		render(<ImageCropModal src="blob:preview" onCropDone={onCropDone} onCancel={vi.fn()} />);
		loadPreview();
		fireEvent.change(screen.getByRole('slider', { name: /Độ sáng/ }), { target: { value: '130' } });
		fireEvent.change(screen.getByRole('slider', { name: /Tương phản/ }), {
			target: { value: '80' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Áp dụng' }));

		await waitFor(() => expect(onCropDone).toHaveBeenCalledOnce());
		expect(filters.at(-1)).toBe('brightness(130%) contrast(80%)');
	});

	it('keeps the dialog open when export fails', async () => {
		stubCanvas((callback) => {
			callback?.(null);
		});
		const onCancel = vi.fn();
		const onCropDone = vi.fn();
		render(<ImageCropModal src="blob:preview" onCropDone={onCropDone} onCancel={onCancel} />);
		loadPreview();
		fireEvent.click(screen.getByRole('button', { name: 'Áp dụng' }));

		expect(await screen.findByRole('alert')).toHaveTextContent('Không xuất được ảnh. Hãy thử lại.');
		expect(screen.getByRole('dialog', { name: 'Chỉnh sửa ảnh' })).toBeInTheDocument();
		expect(onCancel).not.toHaveBeenCalled();
		expect(onCropDone).not.toHaveBeenCalled();
	});

	it('ignores Escape while an export is in progress', async () => {
		let finish: BlobCallback = () => {};
		stubCanvas((callback) => {
			finish = callback;
		});
		const onCancel = vi.fn();
		const onCropDone = vi.fn();
		render(<ImageCropModal src="blob:preview" onCropDone={onCropDone} onCancel={onCancel} />);
		loadPreview();
		fireEvent.click(screen.getByRole('button', { name: 'Áp dụng' }));
		expect(await screen.findByText('Đang xử lý…')).toBeInTheDocument();

		const crop = screen.getByRole('dialog', { name: 'Chỉnh sửa ảnh' });
		fireEvent(crop, new Event('cancel', { cancelable: true }));
		expect(onCancel).not.toHaveBeenCalled();

		finish(new Blob(['webp'], { type: 'image/webp' }));
		await waitFor(() => expect(onCropDone).toHaveBeenCalledOnce());
	});
});
