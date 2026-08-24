import { type NextRequest } from 'next/server';

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { withAdmin, apiSuccess, apiError } from '@/lib/apiUtils';
import { normalizeImageUpload } from '@/lib/uploadValidation';

export const runtime = 'nodejs';

export const POST = withAdmin(async (request: NextRequest) => {
	const form = await request.formData();
	const file = form.get('file');
	if (!(file instanceof File)) {
		return apiError('Missing file', 400);
	}

	const normalized = await normalizeImageUpload(file);

	const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
	await mkdir(uploadsDir, { recursive: true });
	await writeFile(path.join(uploadsDir, normalized.filename), normalized.bytes);

	return apiSuccess({ url: `/uploads/${normalized.filename}` });
});
