import { parseWithAppError, updateMyClassVocabSetSchema } from '@/features/my-class';
import { AppError } from '@/lib/appError';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { adminUpdateSet, archiveVocabSet } from '@/services/vocabSetService';
import { type NextRequest } from 'next/server';

export const PATCH = withAdmin(async (request: NextRequest, _user, context) => {
	const id = String((await context!.params).id);
	const body = parseWithAppError(updateMyClassVocabSetSchema, await request.json());
	const set = await adminUpdateSet(id, body);
	if (!set) throw new AppError('Không tìm thấy bộ từ', 404);
	return apiSuccess({ set });
});

export const PUT = PATCH;

export const DELETE = withAdmin(async (_request, _user, context) => {
	const id = String((await context!.params).id);
	await archiveVocabSet(id);
	return apiSuccess({ archived: true });
});
