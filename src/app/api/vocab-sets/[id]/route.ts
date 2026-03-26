import { type NextRequest } from 'next/server';

import { withAuth, withErrorHandling, apiSuccess, apiError } from '@/lib/apiUtils';
import { getVocabSetById, updateVocabSet, deleteVocabSet } from '@/services/vocabSetService';

type Params = { params: Promise<{ id: string }> };

/** GET /api/vocab-sets/:id */
export const GET = withErrorHandling(async (_request: NextRequest, context) => {
	const { id } = await context!.params;
	const set = await getVocabSetById(id);
	if (!set) return apiError('Not found', 404);
	return apiSuccess(set);
});

/** PUT /api/vocab-sets/:id */
export const PUT = withAuth(async (request: NextRequest, user, context) => {
	const { id } = await context!.params;
	const existing = await getVocabSetById(id);
	if (!existing) return apiError('Not found', 404);

	// Only owner or admin can edit
	if (existing.ownerId !== user.id && user.role !== 'admin') {
		return apiError('Forbidden', 403);
	}

	const body = await request.json();
	const updated = await updateVocabSet({
		id,
		ownerId: existing.ownerId,
		title: body.title,
		description: body.description,
		terms: body.terms,
		isPublic: user.role === 'admin' ? body.isPublic : undefined,
	});
	if (!updated) return apiError('Update failed', 400);
	return apiSuccess(updated);
});

/** DELETE /api/vocab-sets/:id */
export const DELETE = withAuth(async (request: NextRequest, user, context) => {
	const { id } = await context!.params;
	const existing = await getVocabSetById(id);
	if (!existing) return apiError('Not found', 404);

	if (existing.ownerId !== user.id && user.role !== 'admin') {
		return apiError('Forbidden', 403);
	}

	await deleteVocabSet(id, existing.ownerId);
	return apiSuccess(null);
});
