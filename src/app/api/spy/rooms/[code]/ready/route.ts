import type { NextRequest } from 'next/server';

import { apiError, apiSuccess, withErrorHandling } from '@/features/spy-fall/lib/apiUtils';
import { setReady } from '@/features/spy-fall/services/spyGameService';

export const POST = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const body = (await request.json()) as { token?: string; ready?: boolean };
	if (!body.token) return apiError('TOKEN_REQUIRED', 400);
	const state = await setReady(code, body.token, body.ready ?? true);
	return apiSuccess(state);
});
