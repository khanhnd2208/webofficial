/* ════════════════════════════════════════════════════════════════════════
   GET    /api/vocab-sets/:id  — get set by ID (public)
   PUT    /api/vocab-sets/:id  — admin update (metadata + words)
   DELETE /api/vocab-sets/:id  — soft-delete from user library OR archive (admin)
   ════════════════════════════════════════════════════════════════════════ */
import { withAdmin, withAuth, apiSuccess, apiError } from '@/lib/apiUtils';
import {
	getVocabSetById,
	adminUpdateSet,
	softDeleteFromLibrary,
	archiveVocabSet,
	canReadVocabSet,
} from '@/services/vocabSetService';
import type { UpdateVocabSetInput } from '@/types/vocab';

type _Ctx = { params: Promise<{ id: string }> };

export const GET = withAuth(async (_req, user, ctx) => {
	const { id } = await ctx!.params;
	const set = await getVocabSetById(id);
	if (!set) return apiError('Not found', 404);
	if (!(await canReadVocabSet(user, set))) return apiError('Not found', 404);
	return apiSuccess({ set });
});

export const PUT = withAdmin(async (request, _user, ctx) => {
	const { id } = await ctx!.params;
	const body = await request.json() as UpdateVocabSetInput;
	const set = await adminUpdateSet(id, body);
	if (!set) return apiError('Not found', 404);
	return apiSuccess({ set });
});

export const DELETE = withAuth(async (request, user, ctx) => {
	const { id } = await ctx!.params;
	const url = new URL(request.url);
	const action = url.searchParams.get('action');

	if (action === 'archive') {
		if (user.role !== 'admin') return apiError('Forbidden', 403);
		await archiveVocabSet(id);
		return apiSuccess({ archived: true });
	}

	await softDeleteFromLibrary(user.id, id);
	return apiSuccess({ deleted: true });
});
