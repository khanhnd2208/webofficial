import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { inspectTestRoom } from '@/features/board-game-test/service';
import type { TestGame } from '@/features/board-game-test/types';

export const GET = withAdmin(async (_request, user, context) => {
	const { game, code } = await context!.params;
	return apiSuccess(await inspectTestRoom(user.id || user.email, game as TestGame, code));
});
