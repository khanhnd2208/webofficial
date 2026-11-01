/**
 * The upload API takes PNG, JPEG, WebP or GIF up to 5 MB and 25 megapixels. Phone photos,
 * scans and exports often exceed that or arrive as HEIC, AVIF or BMP, so the browser
 * shrinks and re-encodes them first. Files already within the limits are sent untouched.
 */

const SERVER_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
const UPLOAD_MAX_PIXELS = 25_000_000;
/** Wider than any reading column at 2× density, so diagrams stay sharp when zoomed. */
const MAX_EDGE = 2400;

function formatName(file: File): string {
	const ext = file.name.match(/\.([^.]+)$/)?.[1];
	return (ext ?? file.type.replace(/^image\//, '')).toUpperCase() || 'này';
}

function encode(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
	return new Promise((resolve) => canvas.toBlob(resolve, type, 0.86));
}

export async function prepareImageForUpload(file: File): Promise<File> {
	const supported = SERVER_TYPES.has(file.type.toLowerCase());
	if (supported && file.size <= UPLOAD_MAX_BYTES && file.type === 'image/gif') return file;
	let bitmap: ImageBitmap;
	try {
		bitmap = await createImageBitmap(file);
	} catch {
		// Without a known type, let the server name the formats it accepts.
		if (supported || !file.type) return file;
		throw new Error(
			`Trình duyệt không đọc được ảnh ${formatName(file)}. Hãy lưu ảnh thành PNG hoặc JPEG rồi chọn lại.`,
		);
	}
	try {
		const { width, height } = bitmap;
		if (supported && file.size <= UPLOAD_MAX_BYTES && width * height <= UPLOAD_MAX_PIXELS) {
			return file;
		}
		const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
		const canvas = document.createElement('canvas');
		canvas.width = Math.max(1, Math.round(width * scale));
		canvas.height = Math.max(1, Math.round(height * scale));
		const context = canvas.getContext('2d');
		if (!context) throw new Error('Không thu nhỏ được ảnh trong trình duyệt.');
		context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
		let blob = await encode(canvas, 'image/webp');
		if (blob?.type !== 'image/webp') {
			// Browsers without a WebP encoder fall back to PNG, which can stay too large.
			context.globalCompositeOperation = 'destination-over';
			context.fillStyle = '#fff';
			context.fillRect(0, 0, canvas.width, canvas.height);
			blob = await encode(canvas, 'image/jpeg');
		}
		if (!blob || blob.size > UPLOAD_MAX_BYTES) {
			throw new Error('Ảnh vẫn lớn hơn 5MB sau khi thu nhỏ. Hãy giảm kích thước ảnh rồi chọn lại.');
		}
		const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
		return new File([blob], file.name.replace(/\.[^.]+$/, '') + `.${ext}`, { type: blob.type });
	} finally {
		bitmap.close();
	}
}
