/* GET /api/puzzle/leaderboard?puzzleId= | ?date=YYYY-MM-DD */
import { withErrorHandling, apiSuccess, apiError } from '@/lib/apiUtils';
import {
  getLeaderboardByDate,
  getLeaderboardByPuzzleId,
  getPublishedPuzzleById,
} from '@/services/puzzleService';
import { getPuzzleDateKey } from '@/lib/puzzle/dateKey';

export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 10)));
  const puzzleId = searchParams.get('puzzleId')?.trim();

  if (puzzleId) {
    const puzzle = await getPublishedPuzzleById(puzzleId);
    if (!puzzle) return apiError('Puzzle not found', 404);
    const entries = await getLeaderboardByPuzzleId(puzzleId, limit);
    return apiSuccess({ puzzleId, dateKey: puzzle.dateKey, entries });
  }

  const dateKey = searchParams.get('date') ?? getPuzzleDateKey();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return apiError('Invalid date format', 400);
  }

  const entries = await getLeaderboardByDate(dateKey, limit);
  return apiSuccess({ dateKey, entries });
});
