import RoomModel from '@/features/spy-fall/models/SpyGame';
import type { NextRequest } from 'next/server';

import { apiError, apiSuccess, withErrorHandling, withPublicRoomGuard } from '@/features/spy-fall/lib/apiUtils';
import { isLocale } from '@/features/spy-fall/lib/i18n/types';
import { startGame } from '@/features/spy-fall/services/spyGameService';

const POSTBase = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const body = (await request.json()) as { token?: string; locale?: string };
	if (!body.token) return apiError('TOKEN_REQUIRED', 400);
	const locale = isLocale(body.locale) ? body.locale : 'vi';
	const state = await startGame(code, body.token, locale);
	return apiSuccess(state);
});

export const POST = withPublicRoomGuard(RoomModel, POSTBase);
