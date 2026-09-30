import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { createTestRoom } from '@/features/board-game-test/service';
import { createSchema, parseInput } from '@/features/board-game-test/validation';

export const POST = withAdmin(async (request: NextRequest, user) => {
	const body = parseInput(createSchema, await request.json());
	if (!['spy-fall', 'cheese-thief', 'ma-soi'].includes(body.game)) {
		return NextResponse.json(
			{ ok: false, error: 'INVALID_GAME', code: 'INVALID_GAME' },
			{ status: 400 },
		);
	}
	const room = await createTestRoom(user.id || user.email, body);
	return apiSuccess(room, 201);
});
