import RoomModel from '@/features/werewolf/models/WerewolfRoom';
import type { NextRequest } from 'next/server';

import {
	apiError,
	apiSuccess,
	withErrorHandling,
	withPublicRoomGuard,
} from '@/features/board-game-shared/lib/apiUtils';
import { setRoleCounts } from '@/features/werewolf/services/werewolfService';
import type { RoleCount } from '@/features/werewolf/types';

const PATCHBase = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const body = (await request.json()) as {
		token?: string;
		roleCounts?: RoleCount[];
		cardDeck?: unknown;
	};
	if (!body.token) return apiError('TOKEN_REQUIRED', 400);
	if (body.roleCounts !== undefined && !Array.isArray(body.roleCounts))
		return apiError('INVALID_ROLE', 400);
	if (body.roleCounts === undefined && body.cardDeck === undefined)
		return apiError('INVALID_ROLE', 400);
	const state = await setRoleCounts(code, body.token, body.roleCounts, body.cardDeck);
	return apiSuccess(state);
});

export const PATCH = withPublicRoomGuard(RoomModel, PATCHBase);
