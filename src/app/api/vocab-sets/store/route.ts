/* ════════════════════════════════════════════════════════════════════════
   GET  /api/vocab-sets/store        — paginated public store
   POST /api/vocab-sets/store        — add set to user's library
   ════════════════════════════════════════════════════════════════════════ */
import { withAdmin, apiSuccess, apiError } from '@/lib/apiUtils';
import { getStore, addToLibrary, AlreadyOwnedError } from '@/services/vocabSetService';

export const GET = withAdmin(async (request, user) => {
	const url = new URL(request.url);
	const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
	const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') ?? 20)));

	const result = await getStore(user.id, page, limit);
	return apiSuccess(result);
});

export const POST = withAdmin(async (request, user) => {
	const body = await request.json() as { vocabSetId?: string };
	const { vocabSetId } = body;
	if (!vocabSetId) return apiError('vocabSetId is required', 400);

	try {
		await addToLibrary(user.id, vocabSetId);
		return apiSuccess({ added: true }, 201);
	} catch (err) {
		if (err instanceof AlreadyOwnedError) {
			return apiError('Bạn đã sở hữu bộ từ này', 409);
		}
		throw err;
	}
});
