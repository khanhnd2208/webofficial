import { type NextRequest } from 'next/server';

import { withAuth, withErrorHandling, apiSuccess, apiError } from '@/lib/apiUtils';
import { listPublicSets, cloneVocabSet, getPublicSetById } from '@/services/vocabSetService';

/** GET /api/vocab-sets/store — list all public sets */
export const GET = withErrorHandling(async () => {
	const items = await listPublicSets();
	return apiSuccess({ items, total: items.length });
});

/** POST /api/vocab-sets/store — clone a public set */
export const POST = withAuth(async (request: NextRequest, user) => {
	const body = await request.json();
	const { sourceId } = body;

	if (!sourceId) {
		return apiError('sourceId is required', 400);
	}

	// Verify the source set exists and is public
	const source = await getPublicSetById(sourceId);
	if (!source) {
		return apiError('Public set not found', 404);
	}

	const cloned = await cloneVocabSet({
		sourceId,
		ownerId: user.id,
		ownerName: user.name,
	});

	if (!cloned) {
		return apiError('Clone failed', 400);
	}

	return apiSuccess(cloned, 201);
});
