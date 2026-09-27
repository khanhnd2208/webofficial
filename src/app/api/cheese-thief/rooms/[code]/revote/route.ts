import type { NextRequest } from 'next/server';

import { revote } from '@/features/cheese-thief/services/cheeseThiefService';
import { apiError, apiSuccess, withErrorHandling } from '@/features/spy-fall/lib/apiUtils';

export const POST = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const body = (await request.json()) as { token?: string };
	if (!body.token) return apiError('TOKEN_REQUIRED', 400);
	return apiSuccess(await revote(code, body.token));
});
