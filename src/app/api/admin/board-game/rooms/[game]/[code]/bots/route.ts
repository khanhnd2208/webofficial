import type { NextRequest } from 'next/server';

import { apiError, apiSuccess, withErrorHandling } from '@/features/board-game-shared/lib/apiUtils';
import { addLiveBot, isLiveBotGame } from '@/features/board-game-bots/liveBots';
import { auth } from '@/lib/auth';

/**
 * Seat a bot in a real room's lobby. Needs a signed-in admin who is also this room's host (their
 * player token); bots are then removed with the room's normal "kick".
 */
export const POST = withErrorHandling(async (request: NextRequest, context) => {
	const session = await auth();
	if (session?.user?.role !== 'admin') return apiError('BOT_ADMIN_ONLY', 403);
	const { game, code } = await context!.params;
	if (!game || !code || !isLiveBotGame(game)) return apiError('ROOM_NOT_FOUND', 404);
	const body = (await request.json().catch(() => ({}))) as { token?: string };
	if (!body.token) return apiError('TOKEN_REQUIRED', 400);
	const name = await addLiveBot(game, code, body.token);
	return apiSuccess({ name }, 201);
});
