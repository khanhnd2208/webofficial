import RoomModel from '@/features/werewolf/models/WerewolfRoom';
import type { NextRequest } from 'next/server';

import {
	apiError,
	apiSuccess,
	withErrorHandling,
	withPublicRoomGuard,
} from '@/features/spy-fall/lib/apiUtils';
import { setRoleCounts } from '@/features/werewolf/services/werewolfService';
import type { RoleCount } from '@/features/werewolf/types';

const PATCHBase = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const body = (await request.json()) as { token?: string; roleCounts?: RoleCount[] };
	if (!body.token) return apiError('TOKEN_REQUIRED', 400);
	if (!Array.isArray(body.roleCounts)) return apiError('INVALID_ROLE', 400);
	const state = await setRoleCounts(code, body.token, body.roleCounts);
	return apiSuccess(state);
});

export const PATCH = withPublicRoomGuard(RoomModel, PATCHBase);
