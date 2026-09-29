import RoomModel from '@/features/cheese-thief/models/CheeseThiefRoom';
import type { NextRequest } from 'next/server';

import { apiError, apiSuccess, withErrorHandling, withPublicRoomGuard } from '@/features/spy-fall/lib/apiUtils';
import { joinRoom } from '@/features/cheese-thief/services/cheeseThiefService';

const POSTBase = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const body = (await request.json()) as { name?: string; playerToken?: string };
	if (!body.name) return apiError('PLAYER_NAME_REQUIRED', 400);
	const result = await joinRoom(code, body.name, body.playerToken);
	return apiSuccess(result);
});

export const POST = withPublicRoomGuard(RoomModel, POSTBase);
