import { type NextRequest } from 'next/server';

import { withAuth, apiSuccess } from '@/lib/apiUtils';
import { recordLogin, getStreak } from '@/services/streakService';

/** POST /api/streak — record a login for today */
export const POST = withAuth(async (_request: NextRequest, user) => {
	const data = await recordLogin(user.id);
	return apiSuccess(data);
});

/** GET /api/streak — get current streak data */
export const GET = withAuth(async (_request: NextRequest, user) => {
	const data = await getStreak(user.id);
	return apiSuccess(data);
});
