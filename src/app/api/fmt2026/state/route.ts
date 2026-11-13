import { type NextRequest } from 'next/server';

import { hasBoothAccess } from '@/features/fmt2026/services/boothAccess';
import { getBoothState } from '@/features/fmt2026/services/drawService';
import { apiSuccess, withErrorHandling } from '@/lib/apiUtils';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (request: NextRequest) => {
	const state = await getBoothState(await hasBoothAccess(request));
	const response = apiSuccess(state);
	response.headers.set('cache-control', 'no-store');
	return response;
});
