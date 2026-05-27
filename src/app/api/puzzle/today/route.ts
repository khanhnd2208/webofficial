/* GET /api/puzzle/today — Load puzzle by puzzleId or calendar/staging date */
import { withErrorHandling, apiSuccess, apiError } from '@/lib/apiUtils';
import {
  getPublishedPuzzleByDateKey,
  getPublishedPuzzleById,
  getUserAttemptForDate,
  getUserAttemptForPuzzle,
} from '@/services/puzzleService';
import { getApiUser } from '@/lib/apiAuth';
import { getPuzzleStatsPublic } from '@/services/puzzleStreakService';
import { resolvePuzzleDateKey } from '@/lib/puzzle/puzzleDateOverride';
import { toPublicPuzzle } from '@/lib/puzzle/serializer';
import type { PuzzleNotes, PuzzleSolution } from '@/types/puzzle';

function formatAttempt(att: {
  id: string;
  status: string;
  startedAt: Date;
  submittedAt: Date | null;
  durationMs: number | null;
  mistakes: number;
  progressJson: unknown;
  notesJson: unknown;
}) {
  return {
    id: att.id,
    status: att.status,
    startedAt: att.startedAt.toISOString(),
    submittedAt: att.submittedAt?.toISOString() ?? null,
    durationMs: att.durationMs,
    mistakes: att.mistakes,
    progress: (att.progressJson as PuzzleSolution | null) ?? undefined,
    notes: (att.notesJson as PuzzleNotes | null) ?? undefined,
  };
}

export const GET = withErrorHandling(async (request) => {
  const { searchParams } = new URL(request.url);
  const puzzleId = searchParams.get('puzzleId')?.trim();

  let row;
  if (puzzleId) {
    row = await getPublishedPuzzleById(puzzleId);
    if (!row) return apiError('Puzzle not found or not published', 404);
  } else {
    const dateKey = resolvePuzzleDateKey(searchParams.get('date'));
    row = await getPublishedPuzzleByDateKey(dateKey);
    if (!row) return apiError(`No puzzle published for ${dateKey}`, 404);
  }

  const puzzle = toPublicPuzzle(row);
  const user = await getApiUser(request);
  let attempt = null;
  let stats = null;

  if (user) {
    const { attempt: att } = puzzleId
      ? await getUserAttemptForPuzzle(user.id, puzzleId)
      : await getUserAttemptForDate(user.id, puzzle.dateKey);
    if (att) attempt = formatAttempt(att);
    stats = await getPuzzleStatsPublic(user.id);
  }

  return apiSuccess({ puzzle, attempt, stats });
});
