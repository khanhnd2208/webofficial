/* GET /api/puzzle/stats — User puzzle streak and stats */
import { withAuth, apiSuccess } from '@/lib/apiUtils';
import { getPuzzleStatsPublic } from '@/services/puzzleStreakService';
import { getUserAttemptForToday } from '@/services/puzzleService';

export const GET = withAuth(async (_request, user) => {
  const stats = await getPuzzleStatsPublic(user.id);
  const { attempt } = await getUserAttemptForToday(user.id);

  return apiSuccess({
    stats,
    todayAttempt: attempt
      ? {
          status: attempt.status,
          durationMs: attempt.durationMs,
          mistakes: attempt.mistakes,
        }
      : null,
  });
});
