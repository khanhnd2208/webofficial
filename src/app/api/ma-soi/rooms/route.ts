import type { NextRequest } from 'next/server';

import { apiSuccess, withErrorHandling } from '@/features/board-game-shared/lib/apiUtils';
import { createRoom } from '@/features/werewolf/services/werewolfService';

export const POST = withErrorHandling(async (request: NextRequest) => {
	const body = (await request.json()) as { hostName?: string };
	const result = await createRoom(body.hostName ?? '');
	return apiSuccess(result, 201);
});
