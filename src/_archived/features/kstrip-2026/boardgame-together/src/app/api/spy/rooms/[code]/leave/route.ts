import type { NextRequest } from 'next/server';

import { apiError, apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { leaveRoom } from '@/services/spyGameService';

export const POST = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const body = (await request.json()) as { token?: string };
	if (!body.token) return apiError('TOKEN_REQUIRED', 400);
	const result = await leaveRoom(code, body.token);
	return apiSuccess(result);
});
