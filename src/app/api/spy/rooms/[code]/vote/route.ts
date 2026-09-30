import RoomModel from '@/features/spy-fall/models/SpyGame';
import type { NextRequest } from 'next/server';

import {
	apiError,
	apiSuccess,
	withErrorHandling,
	withPublicRoomGuard,
} from '@/features/board-game-shared/lib/apiUtils';
import { submitVote } from '@/features/spy-fall/services/spyGameService';
const POSTBase = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const body = (await request.json()) as { token?: string; targetId?: string | null };
	if (!body.token) return apiError('TOKEN_REQUIRED', 400);
	const state = await submitVote(code, body.token, body.targetId ?? null);
	return apiSuccess(state);
});

export const POST = withPublicRoomGuard(RoomModel, POSTBase);
