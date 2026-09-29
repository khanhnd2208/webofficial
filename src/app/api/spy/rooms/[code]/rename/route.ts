import RoomModel from '@/features/spy-fall/models/SpyGame';
import type { NextRequest } from 'next/server';

import { apiError, apiSuccess, withErrorHandling, withPublicRoomGuard } from '@/features/spy-fall/lib/apiUtils';
import { renamePlayer } from '@/features/spy-fall/services/spyGameService';

const PATCHBase = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const body = (await request.json()) as { token?: string; name?: string };
	if (!body.token) return apiError('TOKEN_REQUIRED', 400);
	if (!body.name) return apiError('PLAYER_NAME_REQUIRED', 400);
	const state = await renamePlayer(code, body.token, body.name);
	return apiSuccess(state);
});

export const PATCH = withPublicRoomGuard(RoomModel, PATCHBase);
