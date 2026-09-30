import RoomModel from '@/features/werewolf/models/WerewolfRoom';
import type { NextRequest } from 'next/server';

import {
	apiError,
	apiSuccess,
	withErrorHandling,
	withPublicRoomGuard,
} from '@/features/board-game-shared/lib/apiUtils';
import { markViewed } from '@/features/werewolf/services/werewolfService';

const POSTBase = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const body = (await request.json()) as { token?: string };
	if (!body.token) return apiError('TOKEN_REQUIRED', 400);
	const state = await markViewed(code, body.token);
	return apiSuccess(state);
});

export const POST = withPublicRoomGuard(RoomModel, POSTBase);
