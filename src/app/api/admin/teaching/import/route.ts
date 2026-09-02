import { AppError } from '@/lib/appError';
import {
	commitStudentListImport,
	parseWithAppError,
	previewRosterImport,
	setupTeachingClassFromRoster,
	teachingClassSetupFromRosterSchema,
} from '@/features/teaching';
import { readRosterImportSource } from '@/features/teaching/imports/readRosterImportSource';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import type { NextRequest } from 'next/server';

export const POST = withAdmin(async (request: NextRequest) => {
	const mode = request.nextUrl.searchParams.get('mode') === 'commit' ? 'commit' : 'preview';
	const contentType = request.headers.get('content-type') ?? '';
	if (mode === 'commit' && contentType.includes('application/json')) {
		const body = parseWithAppError(teachingClassSetupFromRosterSchema, await request.json());
		return apiSuccess(await setupTeachingClassFromRoster(body), 201);
	}
	if (mode === 'commit' && contentType.includes('multipart/form-data')) {
		const form = await request.formData();
		const file = form.get('file');
		if (!(file instanceof File)) throw new AppError('Upload an Excel student list (.xlsx)', 422, 'VALIDATION');
		return apiSuccess(await commitStudentListImport(Buffer.from(await file.arrayBuffer())), 201);
	}
	return apiSuccess(await previewRosterImport({ source: await readRosterImportSource(request) }));
});
