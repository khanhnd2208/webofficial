import type { NextRequest } from 'next/server';

import { apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { createNightMarketRoom } from '@/services/nightMarketService';
import type { CreateNightMarketRoomInput } from '@/types/nightMarket';

export const POST = withErrorHandling(async (request: NextRequest) => {
	const input = (await request.json()) as CreateNightMarketRoomInput;
	return apiSuccess(await createNightMarketRoom(input), 201);
});
