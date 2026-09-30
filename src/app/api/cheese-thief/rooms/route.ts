import type { NextRequest } from 'next/server';

import { apiSuccess, withErrorHandling } from '@/features/board-game-shared/lib/apiUtils';
import { createRoom, listPublicRooms } from '@/features/cheese-thief/services/cheeseThiefService';
import type { CreateRoomInput } from '@/features/cheese-thief/types';

export const GET = withErrorHandling(async () => {
	const rooms = await listPublicRooms();
	return apiSuccess(rooms);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
	const body = (await request.json()) as CreateRoomInput;
	const state = await createRoom(body);
	return apiSuccess({ state, playerToken: state.self?.token }, 201);
});
