import type { NextRequest } from 'next/server';

import { apiError, apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { kickPlayer } from '@/services/spyGameService';

export const POST = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const body = (await request.json()) as { token?: string; targetToken?: string };
	if (!body.token) return apiError('TOKEN_REQUIRED', 400);
	if (!body.targetToken) return apiError('TOKEN_REQUIRED', 400);
	const state = await kickPlayer(code, body.token, body.targetToken);
	return apiSuccess(state);
});
