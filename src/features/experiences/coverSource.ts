import { stat } from 'node:fs/promises';
import path from 'node:path';

/** Missing local uploads get a decorative cover even before JavaScript starts. */
export async function storyCoverSource(src: string): Promise<string> {
	if (!/^\/uploads\/[a-zA-Z0-9._-]+$/.test(src)) return src;
	try {
		const photo = await stat(path.join(process.cwd(), 'public', 'uploads', path.basename(src)));
		if (photo.isFile()) return src;
	} catch {
		// Older posts can refer to uploads not present in this checkout.
	}
	return '/brand/learning-landscape.webp';
}
