import RoomModel from '@/features/spy-fall/models/SpyGame';
import type { NextRequest } from 'next/server';

import {
	apiSuccess,
	withErrorHandling,
	withPublicRoomGuard,
} from '@/features/board-game-shared/lib/apiUtils';
import { stepLiveBots } from '@/features/board-game-bots/liveBots';
import { getScopedState } from '@/features/spy-fall/services/spyGameService';

const GETBase = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const token = request.nextUrl.searchParams.get('token');
	// Bots an admin seated make their next move as people poll, before the state is read.
	await stepLiveBots('spy-fall', code);
	const state = await getScopedState(code, token);
	return apiSuccess(state);
});

export const GET = withPublicRoomGuard(RoomModel, GETBase);
