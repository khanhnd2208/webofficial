import type { NextRequest } from 'next/server';

import { apiSuccess, withErrorHandling } from '@/features/spy-fall/lib/apiUtils';
import { getScopedState } from '@/features/cheese-thief/services/cheeseThiefService';

export const GET = withErrorHandling(async (request: NextRequest, context) => {
	const { code } = await context!.params;
	const token = request.nextUrl.searchParams.get('token');
	const state = await getScopedState(code, token);
	return apiSuccess(state);
});
