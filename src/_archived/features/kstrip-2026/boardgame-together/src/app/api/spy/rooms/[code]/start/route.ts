import type { NextRequest } from 'next/server';

import { apiError, apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { isLocale } from '@/lib/i18n/types';
import { startGame } from '@/services/spyGameService';

export const POST = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const body = (await request.json()) as { token?: string; locale?: string };
	if (!body.token) return apiError('TOKEN_REQUIRED', 400);
	const locale = isLocale(body.locale) ? body.locale : 'vi';
	const state = await startGame(code, body.token, locale);
	return apiSuccess(state);
});
