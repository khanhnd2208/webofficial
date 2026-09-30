import RoomModel from '@/features/werewolf/models/WerewolfRoom';
import type { NextRequest } from 'next/server';

import {
	apiError,
	apiSuccess,
	withErrorHandling,
	withPublicRoomGuard,
} from '@/features/board-game-shared/lib/apiUtils';
import { leaveRoom } from '@/features/werewolf/services/werewolfService';

const POSTBase = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const body = (await request.json()) as { token?: string };
	if (!body.token) return apiError('TOKEN_REQUIRED', 400);
	const result = await leaveRoom(code, body.token);
	return apiSuccess(result);
});

export const POST = withPublicRoomGuard(RoomModel, POSTBase);
