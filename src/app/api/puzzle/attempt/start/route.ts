/* POST /api/puzzle/attempt/start — Start or resume today's attempt */
import { Prisma } from '@prisma/client';
import { withAuth, apiSuccess, apiError, AppError } from '@/lib/apiUtils';
import {
  getPublishedPuzzleByDateKey,
  getPublishedPuzzleById,
  startAttempt,
} from '@/services/puzzleService';
import { resolvePuzzleDateKey } from '@/lib/puzzle/puzzleDateOverride';

export const POST = withAuth(async (request, user) => {
  const { searchParams } = new URL(request.url);
  const puzzleId = searchParams.get('puzzleId')?.trim();

  let puzzle;
  if (puzzleId) {
    puzzle = await getPublishedPuzzleById(puzzleId);
    if (!puzzle) return apiError('Puzzle not found or not published', 404);
  } else {
    const dateKey = resolvePuzzleDateKey(searchParams.get('date'));
    puzzle = await getPublishedPuzzleByDateKey(dateKey);
    if (!puzzle) return apiError(`No puzzle published for ${dateKey}`, 404);
  }

  const userName = user.name ?? user.email ?? 'Player';

  let attempt;
  try {
    attempt = await startAttempt(user.id, userName, puzzle.id);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('[puzzle/start] Prisma error', e.code, e.meta);
      if (e.code === 'P2022') {
        throw new AppError(
          'Database schema outdated. Run: npm run db:migrate:deploy',
          503,
        );
      }
    }
    const msg = e instanceof Error ? e.message : 'Start failed';
    if (msg === 'Invalid user session') throw new AppError('Phiên đăng nhập không hợp lệ. Hãy đăng xuất và đăng nhập lại.', 401);
    if (msg === 'Puzzle not found') throw new AppError(msg, 404);
    throw e;
  }

  return apiSuccess({
    attempt: {
      id: attempt.id,
      status: attempt.status,
      startedAt: attempt.startedAt.toISOString(),
      submittedAt: attempt.submittedAt?.toISOString() ?? null,
      durationMs: attempt.durationMs,
      mistakes: attempt.mistakes,
    },
    puzzleId: puzzle.id,
  });
});
