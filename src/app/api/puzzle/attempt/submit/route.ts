/* POST /api/puzzle/attempt/submit */
import { withAuth, apiSuccess, apiError, AppError } from '@/lib/apiUtils';
import { submitAttempt, getPublishedPuzzleById } from '@/services/puzzleService';
import type { PuzzleSolution } from '@/types/puzzle';

export const POST = withAuth(async (request, user) => {
  let body: { puzzleId: string; answer: PuzzleSolution };
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON', 400);
  }

  if (!body.puzzleId) return apiError('Invalid puzzleId', 400);

  const puzzle = await getPublishedPuzzleById(body.puzzleId);
  if (!puzzle) return apiError('Puzzle not found or not published', 404);
  if (!body.answer || typeof body.answer !== 'object') {
    return apiError('Invalid answer', 400);
  }

  const userName = user.name ?? user.email ?? 'Player';

  try {
    const result = await submitAttempt({
      userId: user.id,
      userName,
      puzzleId: body.puzzleId,
      answer: body.answer,
    });
    return apiSuccess(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Submit failed';
    if (msg === 'Already solved') return apiError(msg, 409);
    if (msg === 'No active attempt. Start attempt first.') return apiError(msg, 400);
    if (msg === 'Submit too fast') return apiError(msg, 422);
    throw new AppError(msg, 400);
  }
});
