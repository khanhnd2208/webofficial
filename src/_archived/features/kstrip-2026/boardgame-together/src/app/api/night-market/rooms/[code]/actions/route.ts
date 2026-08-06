import type { NextRequest } from 'next/server';

import { apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { performNightMarketAction } from '@/services/nightMarketService';
import type { NightMarketActionInput } from '@/types/nightMarket';

export const POST = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const input = (await request.json()) as NightMarketActionInput;
	return apiSuccess(await performNightMarketAction(code, input));
});
