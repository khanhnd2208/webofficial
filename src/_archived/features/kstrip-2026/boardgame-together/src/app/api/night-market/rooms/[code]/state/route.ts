import type { NextRequest } from 'next/server';

import { apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { getNightMarketState } from '@/services/nightMarketService';

export const GET = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	return apiSuccess(await getNightMarketState(code, request.nextUrl.searchParams.get('token')));
});
