import 'server-only';

import { randomUUID } from 'node:crypto';

import sharp from 'sharp';

import { AppError } from '@/lib/appError';

export const IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_UPLOAD_MAX_PIXELS = 25_000_000;
/** Longest stored edge: sharp on a 2× screen, without keeping camera-sized files. */
const IMAGE_UPLOAD_MAX_EDGE = 2400;
export const MUSIC_UPLOAD_MAX_BYTES = 15 * 1024 * 1024;

const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

function hasPrefix(bytes: Buffer, prefix: number[]) {
	return prefix.every((value, index) => bytes[index] === value);
}

export async function normalizeImageUpload(
	file: File,
): Promise<{ bytes: Buffer; filename: string }> {
	if (!IMAGE_TYPES.has(file.type.toLowerCase())) {
		throw new AppError('Chỉ chấp nhận ảnh PNG, JPEG, WebP hoặc GIF.', 400, 'INVALID_FILE_TYPE');
	}
	if (file.size <= 0 || file.size > IMAGE_UPLOAD_MAX_BYTES) {
		throw new AppError('Ảnh quá lớn hoặc rỗng (tối đa 5MB).', 400, 'FILE_TOO_LARGE');
	}

	const input = Buffer.from(await file.arrayBuffer());
	const looksLikeImage =
		(hasPrefix(input, [0x89, 0x50, 0x4e, 0x47]) && file.type === 'image/png') ||
		(hasPrefix(input, [0xff, 0xd8, 0xff]) && file.type === 'image/jpeg') ||
		(input.subarray(0, 4).toString('ascii') === 'RIFF' &&
			input.subarray(8, 12).toString('ascii') === 'WEBP' &&
			file.type === 'image/webp') ||
		((input.subarray(0, 6).toString('ascii') === 'GIF89a' ||
			input.subarray(0, 6).toString('ascii') === 'GIF87a') &&
			file.type === 'image/gif');
	if (!looksLikeImage)
		throw new AppError(
			'Nội dung file không khớp với định dạng ảnh.',
			400,
			'INVALID_FILE_SIGNATURE',
		);

	try {
		const bytes = await sharp(input, { limitInputPixels: IMAGE_UPLOAD_MAX_PIXELS })
			.rotate()
			.resize({
				width: IMAGE_UPLOAD_MAX_EDGE,
				height: IMAGE_UPLOAD_MAX_EDGE,
				fit: 'inside',
				withoutEnlargement: true,
			})
			.webp({ quality: 86 })
			.toBuffer();
		return { bytes, filename: `${randomUUID()}.webp` };
	} catch (error) {
		if (error instanceof Error && /pixel limit/i.test(error.message)) {
			throw new AppError(
				'Ảnh quá nhiều điểm ảnh (tối đa 25 megapixel). Hãy giảm kích thước ảnh.',
				400,
				'IMAGE_TOO_MANY_PIXELS',
			);
		}
		throw new AppError('Không thể đọc hoặc chuẩn hóa ảnh.', 422, 'INVALID_IMAGE');
	}
}

export async function readMp3Upload(file: File): Promise<{ bytes: Buffer; filename: string }> {
	if (file.size <= 0 || file.size > MUSIC_UPLOAD_MAX_BYTES) {
		throw new AppError('File nhạc quá lớn hoặc rỗng (tối đa 15MB).', 400, 'FILE_TOO_LARGE');
	}
	if (file.type && file.type !== 'audio/mpeg' && !file.name.toLowerCase().endsWith('.mp3')) {
		throw new AppError('Chỉ chấp nhận file MP3.', 400, 'INVALID_FILE_TYPE');
	}
	const bytes = Buffer.from(await file.arrayBuffer());
	const isMp3 =
		hasPrefix(bytes, [0x49, 0x44, 0x33]) || (bytes[0] === 0xff && (bytes[1]! & 0xe0) === 0xe0);
	if (!isMp3)
		throw new AppError('Nội dung file không phải MP3 hợp lệ.', 400, 'INVALID_FILE_SIGNATURE');
	return { bytes, filename: `${randomUUID()}.mp3` };
}
