import type { NextRequest } from 'next/server';

import { apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { joinNightMarketRoom } from '@/services/nightMarketService';

export const POST = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const body = (await request.json()) as { name: string; playerToken?: string };
	return apiSuccess(await joinNightMarketRoom(code, body.name, body.playerToken));
});
