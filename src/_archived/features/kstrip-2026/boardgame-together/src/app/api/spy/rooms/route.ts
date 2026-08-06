import type { NextRequest } from 'next/server';

import { apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { createRoom, listPublicRooms } from '@/services/spyGameService';
import type { CreateRoomInput } from '@/types/spyGame';

export const GET = withErrorHandling(async () => {
	const rooms = await listPublicRooms();
	return apiSuccess(rooms);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
	const body = (await request.json()) as CreateRoomInput;
	const state = await createRoom(body);
	const hostToken = state.self?.token;
	return apiSuccess({ state, playerToken: hostToken }, 201);
});
