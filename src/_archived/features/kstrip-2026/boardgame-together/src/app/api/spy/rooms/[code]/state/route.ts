import type { NextRequest } from 'next/server';

import { apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { getScopedState } from '@/services/spyGameService';

export const GET = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const token = request.nextUrl.searchParams.get('token');
	const state = await getScopedState(code, token);
	return apiSuccess(state);
});
