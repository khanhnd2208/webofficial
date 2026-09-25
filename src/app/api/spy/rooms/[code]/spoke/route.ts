import type { NextRequest } from 'next/server';

import { apiError, apiSuccess, withErrorHandling } from '@/features/spy-fall/lib/apiUtils';
import { hostMarkSpoke, markSpoke } from '@/features/spy-fall/services/spyGameService';

export const POST = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const body = (await request.json()) as {
		token?: string;
		targetToken?: string;
		spoken?: boolean;
	};
	if (!body.token) return apiError('TOKEN_REQUIRED', 400);

	if (body.targetToken != null) {
		const state = await hostMarkSpoke(code, body.token, body.targetToken, body.spoken ?? true);
		return apiSuccess(state);
	}

	const state = await markSpoke(code, body.token);
	return apiSuccess(state);
});
