/* ════════════════════════════════════════════════════════════════════════
   POST /api/vocab-stats  — record practice results
   GET  /api/vocab-stats  — get all word stats for current user
   ════════════════════════════════════════════════════════════════════════ */
import { withAuth, apiSuccess, apiError } from '@/lib/apiUtils';
import { recordPracticeResults, getUserWordStats } from '@/services/wordStatsService';
import type { PracticeResultDTO } from '@/types/vocab';

export const POST = withAuth(async (request, user) => {
	const body = await request.json() as { results?: PracticeResultDTO[] };
	if (!Array.isArray(body.results) || body.results.length === 0) {
		return apiError('results array is required', 400);
	}
	await recordPracticeResults(user.id, body.results);
	return apiSuccess({ recorded: body.results.length });
});

export const GET = withAuth(async (_req, user) => {
	const stats = await getUserWordStats(user.id);
	return apiSuccess({ stats, total: stats.length });
});
