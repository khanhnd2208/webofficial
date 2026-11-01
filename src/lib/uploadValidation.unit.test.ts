import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { normalizeImageUpload } from './uploadValidation';

async function png(width: number, height: number) {
	const bytes = await sharp({ create: { width, height, channels: 3, background: '#cde' } })
		.png()
		.toBuffer();
	return new File([new Uint8Array(bytes)], 'anh.png', { type: 'image/png' });
}

describe('normalizeImageUpload', () => {
	it('stores camera-sized images at a 2400px longest edge', async () => {
		const { bytes, filename } = await normalizeImageUpload(await png(3600, 1200));
		expect(filename).toMatch(/\.webp$/);
		expect(await sharp(bytes).metadata()).toMatchObject({ width: 2400, height: 800 });
	});

	it('keeps small images at their own size', async () => {
		const { bytes } = await normalizeImageUpload(await png(640, 480));
		expect(await sharp(bytes).metadata()).toMatchObject({ width: 640, height: 480 });
	});

	it('names the pixel limit instead of a generic read error', async () => {
		await expect(normalizeImageUpload(await png(6000, 5000))).rejects.toMatchObject({
			code: 'IMAGE_TOO_MANY_PIXELS',
			status: 400,
		});
	});
});
