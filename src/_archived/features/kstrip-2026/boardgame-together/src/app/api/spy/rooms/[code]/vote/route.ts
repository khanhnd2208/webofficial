import type { NextRequest } from 'next/server';

import { apiError, apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { submitVote } from '@/services/spyGameService';
import type { VoteInput } from '@/types/spyGame';

export const POST = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const body = (await request.json()) as VoteInput & { token?: string };
	if (!body.token) return apiError('TOKEN_REQUIRED', 400);
	const { token, ...vote } = body;
	const state = await submitVote(code, token, vote);
	return apiSuccess(state);
});
