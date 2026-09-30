import RoomModel from '@/features/cheese-thief/models/CheeseThiefRoom';
import type { NextRequest } from 'next/server';

import {
	apiError,
	apiSuccess,
	withErrorHandling,
	withPublicRoomGuard,
} from '@/features/board-game-shared/lib/apiUtils';
import { kickPlayer } from '@/features/cheese-thief/services/cheeseThiefService';

const POSTBase = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const body = (await request.json()) as { token?: string; targetId?: string };
	if (!body.token) return apiError('TOKEN_REQUIRED', 400);
	if (!body.targetId) return apiError('PLAYER_NOT_FOUND', 400);
	return apiSuccess(await kickPlayer(code, body.token, body.targetId));
});

export const POST = withPublicRoomGuard(RoomModel, POSTBase);
