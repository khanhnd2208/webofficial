import type { NextRequest } from 'next/server';

import { apiError, apiSuccess, withErrorHandling } from '@/features/spy-fall/lib/apiUtils';
import { joinRoom } from '@/features/werewolf/services/werewolfService';

export const POST = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const body = (await request.json()) as { name?: string; playerToken?: string };
	if (!body.name?.trim()) return apiError('PLAYER_NAME_REQUIRED', 400);
	const result = await joinRoom(code, body.name, body.playerToken);
	return apiSuccess(result, 201);
});
