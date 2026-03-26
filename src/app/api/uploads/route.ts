import { type NextRequest } from 'next/server';

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { withAdmin, apiSuccess, apiError } from '@/lib/apiUtils';

export const runtime = 'nodejs';

function safeExt(contentType: string): string {
	const ct = contentType.toLowerCase();
	if (ct.includes('png')) return 'png';
	if (ct.includes('jpeg') || ct.includes('jpg')) return 'jpg';
	if (ct.includes('webp')) return 'webp';
	if (ct.includes('gif')) return 'gif';
	return 'bin';
}

export const POST = withAdmin(async (request: NextRequest) => {
	const form = await request.formData();
	const file = form.get('file');
	if (!(file instanceof File)) {
		return apiError('Missing file', 400);
	}

	if (!file.type.startsWith('image/')) {
		return apiError('Only image uploads are allowed', 400);
	}

	const maxBytes = 5 * 1024 * 1024;
	if (file.size > maxBytes) {
		return apiError('Image too large (max 5MB)', 400);
	}

	const bytes = Buffer.from(await file.arrayBuffer());
	const ext = safeExt(file.type);
	const name = `${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;

	const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
	await mkdir(uploadsDir, { recursive: true });
	await writeFile(path.join(uploadsDir, name), bytes);

	return apiSuccess({ url: `/uploads/${name}` });
});
