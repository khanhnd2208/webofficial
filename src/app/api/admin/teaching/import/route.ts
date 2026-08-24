import { AppError } from '@/lib/appError';
import { commitStudentListImport, previewStudentListImport } from '@/features/teaching';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import type { NextRequest } from 'next/server';

async function readWorkbook(request: NextRequest) {
	const form = await request.formData();
	const file = form.get('file');
	if (!(file instanceof File) || file.size === 0 || file.size > 10 * 1024 * 1024) {
		throw new AppError('Upload an Excel student list (.xlsx)', 422, 'VALIDATION');
	}
	const buffer = Buffer.from(await file.arrayBuffer());
	if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) throw new AppError('File .xlsx không hợp lệ.', 422, 'VALIDATION');
	return buffer;
}

export const POST = withAdmin(async (request: NextRequest) => {
	const buffer = await readWorkbook(request);
	const mode = request.nextUrl.searchParams.get('mode') === 'commit' ? 'commit' : 'preview';
	if (mode === 'commit') return apiSuccess(await commitStudentListImport(buffer), 201);
	return apiSuccess(await previewStudentListImport(buffer));
});
