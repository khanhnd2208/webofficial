import { markKnowledgeViewed, parseWithAppError, progressActionSchema } from '@/features/my-class';
import { resolveMyClassActor } from '@/features/my-class/services/resolveActor';
import { apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const POST = withErrorHandling(async (request: NextRequest, context) => {
	const { kuId } = await context!.params;
	const actor = await resolveMyClassActor(request, { ensureGuest: true });
	const body = parseWithAppError(progressActionSchema, await request.json().catch(() => ({})));
	return apiSuccess(await markKnowledgeViewed(actor, String(kuId), body), 201);
});
