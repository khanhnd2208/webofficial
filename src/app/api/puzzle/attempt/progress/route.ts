/* POST /api/puzzle/attempt/progress */
import { withAuth, apiSuccess, apiError } from '@/lib/apiUtils';
import { saveProgress, getPublishedPuzzleById } from '@/services/puzzleService';
import type { PuzzleNotes, PuzzleSolution } from '@/types/puzzle';

export const POST = withAuth(async (request, user) => {
  let body: { puzzleId: string; values: PuzzleSolution; notes?: PuzzleNotes };
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON', 400);
  }

  if (!body.puzzleId) return apiError('Invalid puzzleId', 400);

  const puzzle = await getPublishedPuzzleById(body.puzzleId);
  if (!puzzle) return apiError('Puzzle not found or not published', 404);
  if (!body.values || typeof body.values !== 'object') return apiError('Invalid values', 400);

  try {
    const data = await saveProgress({
      userId: user.id,
      puzzleId: body.puzzleId,
      values: body.values,
      notes: body.notes,
    });
    return apiSuccess(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Save failed';
    return apiError(msg, 400);
  }
});
