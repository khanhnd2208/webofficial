import RoomModel from '@/features/cheese-thief/models/CheeseThiefRoom';
import type { NextRequest } from 'next/server';

import {
	apiError,
	apiSuccess,
	withErrorHandling,
	withPublicRoomGuard,
} from '@/features/board-game-shared/lib/apiUtils';
import { startVote } from '@/features/cheese-thief/services/cheeseThiefService';

const POSTBase = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const body = (await request.json()) as { token?: string };
	if (!body.token) return apiError('TOKEN_REQUIRED', 400);
	return apiSuccess(await startVote(code, body.token));
});

export const POST = withPublicRoomGuard(RoomModel, POSTBase);
