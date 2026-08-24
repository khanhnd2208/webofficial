/* ════════════════════════════════════════════════════════════════════════
   GET  /api/vocab-sets/store        — paginated public store
   POST /api/vocab-sets/store        — add set to user's library
   ════════════════════════════════════════════════════════════════════════ */
import { withAuth, apiSuccess, apiError } from '@/lib/apiUtils';
import { getStore, addToLibrary, AlreadyOwnedError, getVocabSetById } from '@/services/vocabSetService';

export const GET = withAuth(async (request, user) => {
	const url = new URL(request.url);
	const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
	const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') ?? 20)));

	const result = await getStore(user.id, page, limit);
	return apiSuccess(result);
});

export const POST = withAuth(async (request, user) => {
	const body = await request.json() as { vocabSetId?: string };
	const { vocabSetId } = body;
	if (!vocabSetId) return apiError('vocabSetId is required', 400);
	const set = await getVocabSetById(vocabSetId);
	if (!set || set.isArchived || set.isCourseOnly) return apiError('Không tìm thấy bộ từ', 404);

	try {
		await addToLibrary(user.id, vocabSetId, { source: 'STORE' });
		return apiSuccess({ added: true }, 201);
	} catch (err) {
		if (err instanceof AlreadyOwnedError) {
			return apiError('Bạn đã sở hữu bộ từ này', 409);
		}
		throw err;
	}
});
