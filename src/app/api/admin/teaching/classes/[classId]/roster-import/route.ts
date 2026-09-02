import { AppError } from '@/lib/appError';
import {
	commitRosterImport,
	parseWithAppError,
	previewRosterImport,
	rosterImportCommitSchema,
} from '@/features/teaching';
import { readRosterImportSource } from '@/features/teaching/imports/readRosterImportSource';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import type { NextRequest } from 'next/server';

async function classId(context?: { params: Promise<{ classId: string }> }) {
	return String((await context!.params).classId);
}

function rosterImportMode(request: NextRequest): 'preview' | 'commit' {
	const mode = request.nextUrl.searchParams.get('mode');
	if (mode === 'commit') return 'commit';
	if (mode === 'preview') return 'preview';
	const contentType = request.headers.get('content-type') ?? '';
	return contentType.includes('multipart/form-data') ? 'commit' : 'preview';
}

export const POST = withAdmin(async (request: NextRequest, _user, context) => {
	const id = await classId(context);
	const mode = rosterImportMode(request);
	if (mode === 'commit') {
		const contentType = request.headers.get('content-type') ?? '';
		if (contentType.includes('application/json')) {
			const body = parseWithAppError(rosterImportCommitSchema, await request.json());
			return apiSuccess(await commitRosterImport({ classId: id, rows: body.rows }));
		}
		const source = await readRosterImportSource(request);
		const preview = await previewRosterImport({ source, classId: id });
		if (preview.summary.invalidCount > 0 || preview.summary.conflictCount > 0) {
			throw new AppError(
				'Hãy đối chiếu dữ liệu trùng và sửa lỗi trước khi lưu.',
				409,
				'STUDENT_PROFILE_CONFLICT',
			);
		}
		return apiSuccess(
			await commitRosterImport({
				classId: id,
				rows: preview.rows.map((row) => ({
					key: row.key,
					input: row.input,
					expectedUpdatedAt: row.existing?.updatedAt ?? null,
					resolution: row.resolution,
				})),
			}),
		);
	}
	return apiSuccess(
		await previewRosterImport({ source: await readRosterImportSource(request), classId: id }),
	);
});
