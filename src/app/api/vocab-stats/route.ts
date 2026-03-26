import { type NextRequest } from 'next/server';

import { withAuth, apiSuccess, apiError } from '@/lib/apiUtils';
import { recordPracticeResults, getUserWordStats } from '@/services/wordStatsService';

/** POST /api/vocab-stats — record practice results for words */
export const POST = withAuth(async (request: NextRequest, user) => {
	const body = await request.json();
	const results = body.results;

	if (!Array.isArray(results) || results.length === 0) {
		return apiError('results array is required', 400);
	}

	await recordPracticeResults(user.id, results);
	return apiSuccess(null);
});

/** GET /api/vocab-stats — get all word stats for the current user */
export const GET = withAuth(async (_request: NextRequest, user) => {
	const stats = await getUserWordStats(user.id);
	return apiSuccess(stats);
});
