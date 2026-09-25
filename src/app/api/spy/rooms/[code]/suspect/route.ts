import type { NextRequest } from 'next/server';

import { apiError, apiSuccess, withErrorHandling } from '@/features/spy-fall/lib/apiUtils';
import { setSuspect } from '@/features/spy-fall/services/spyGameService';

export const POST = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const body = (await request.json()) as { token?: string; suspectTokens?: string[] | null };
	if (!body.token) return apiError('TOKEN_REQUIRED', 400);
	const state = await setSuspect(code, body.token, body.suspectTokens ?? null);
	return apiSuccess(state);
});
