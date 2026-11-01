import { afterEach, describe, expect, it, vi } from 'vitest';

import { prepareImageForUpload, UPLOAD_MAX_BYTES } from './prepareImage';

function file(name: string, type: string, size: number) {
	return new File([new Uint8Array(size)], name, { type });
}

function stubDecoder(width: number, height: number, encodes: string[] = ['image/webp']) {
	const close = vi.fn();
	vi.stubGlobal(
		'createImageBitmap',
		vi.fn(async () => ({ width, height, close })),
	);
	const drawImage = vi.fn();
	vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
		drawImage,
		fillRect: vi.fn(),
	} as unknown as CanvasRenderingContext2D);
	const queue = [...encodes];
	vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (callback) {
		const type = queue.shift() ?? 'image/png';
		callback(new Blob([new Uint8Array(1000)], { type }));
	});
	return { close, drawImage };
}

describe('prepareImageForUpload', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('sends images within the limits untouched', async () => {
		const { close } = stubDecoder(1200, 800);
		const original = file('so-do.png', 'image/png', 2000);
		expect(await prepareImageForUpload(original)).toBe(original);
		expect(close).toHaveBeenCalled();
	});

	it('shrinks a large phone photo to a 2400px WebP under the upload limit', async () => {
		const { drawImage } = stubDecoder(4032, 3024);
		const prepared = await prepareImageForUpload(
			file('IMG_0001.JPG', 'image/jpeg', UPLOAD_MAX_BYTES + 1),
		);
		expect(prepared).toMatchObject({ name: 'IMG_0001.webp', type: 'image/webp' });
		expect(prepared.size).toBeLessThanOrEqual(UPLOAD_MAX_BYTES);
		expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 2400, 1800);
	});

	it('re-encodes formats the server refuses and too many pixels, falling back to JPEG', async () => {
		stubDecoder(1000, 1000, ['image/png', 'image/jpeg']);
		expect(await prepareImageForUpload(file('scan.avif', 'image/avif', 300))).toMatchObject({
			name: 'scan.jpg',
			type: 'image/jpeg',
		});
		stubDecoder(6000, 5000);
		expect(await prepareImageForUpload(file('ban-ve.png', 'image/png', 400_000))).toMatchObject({
			type: 'image/webp',
		});
	});

	it('explains a format the browser cannot read', async () => {
		vi.stubGlobal(
			'createImageBitmap',
			vi.fn(async () => {
				throw new Error('decode');
			}),
		);
		await expect(prepareImageForUpload(file('IMG_2.HEIC', 'image/heic', 300))).rejects.toThrow(
			/không đọc được ảnh HEIC.*PNG hoặc JPEG/,
		);
		const png = file('a.png', 'image/png', 300);
		expect(await prepareImageForUpload(png)).toBe(png);
	});
});
