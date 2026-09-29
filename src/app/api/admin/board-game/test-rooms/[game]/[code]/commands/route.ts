import type { NextRequest } from 'next/server';

import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { commandTestRoom } from '@/features/board-game-test/service';
import { commandSchema, parseInput } from '@/features/board-game-test/validation';
import type { TestGame } from '@/features/board-game-test/types';

export const POST = withAdmin(async (request: NextRequest, user, context) => {
	const { game, code } = await context!.params;
	const { command, ...cursor } = parseInput(commandSchema, await request.json());
	return apiSuccess(await commandTestRoom(user.id || user.email, game as TestGame, code, command, cursor));
});
