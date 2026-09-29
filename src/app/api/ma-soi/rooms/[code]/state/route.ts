import RoomModel from '@/features/werewolf/models/WerewolfRoom';
import type { NextRequest } from 'next/server';

import { apiSuccess, withErrorHandling, withPublicRoomGuard } from '@/features/spy-fall/lib/apiUtils';
import { getScopedState } from '@/features/werewolf/services/werewolfService';

const GETBase = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const token = request.nextUrl.searchParams.get('token');
	const state = await getScopedState(code, token);
	return apiSuccess(state);
});

export const GET = withPublicRoomGuard(RoomModel, GETBase);
