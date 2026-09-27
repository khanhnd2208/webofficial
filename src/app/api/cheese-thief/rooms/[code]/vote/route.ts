import type { NextRequest } from 'next/server';

import { apiError, apiSuccess, withErrorHandling } from '@/features/spy-fall/lib/apiUtils';
import { submitVote } from '@/features/cheese-thief/services/cheeseThiefService';

export const POST = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const body = (await request.json()) as { token?: string; targetId?: string };
	if (!body.token) return apiError('TOKEN_REQUIRED', 400);
	if (!body.targetId) return apiError('VOTE_NOT_CANDIDATE', 400);
	return apiSuccess(await submitVote(code, body.token, body.targetId));
});
