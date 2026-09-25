import type { NextRequest } from 'next/server';

import { apiError, apiSuccess, withErrorHandling } from '@/features/spy-fall/lib/apiUtils';
import { resolveMrWhite } from '@/features/spy-fall/services/spyGameService';

export const POST = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const body = (await request.json()) as {
		token?: string;
		guessResult?: 'correct' | 'incorrect';
	};
	if (!body.token) return apiError('TOKEN_REQUIRED', 400);
	if (!body.guessResult) return apiError('TOKEN_REQUIRED', 400);
	const state = await resolveMrWhite(code, body.token, { guessResult: body.guessResult });
	return apiSuccess(state);
});
