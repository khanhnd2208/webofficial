/* ════════════════════════════════════════════════════════════════════════
   GET /api/vocab-sets/[id]/leaderboard — admin-only after tool isolation
   ════════════════════════════════════════════════════════════════════════ */
import { withAdmin, apiSuccess, apiError } from '@/lib/apiUtils';
import { prisma } from '@/lib/prisma';

type GameMode = 'MCQ' | 'FILL_BLANK' | 'MATCHING' | 'GUESS_WHO';

type Ctx = { params: Promise<{ id: string }> };

const MODES: GameMode[] = ['MCQ', 'FILL_BLANK', 'MATCHING', 'GUESS_WHO'];
const TOP_N = 10;

export const GET = withAdmin(async (_req, _user, ctx) => {
  const { id: vocabSetId } = await (ctx as Ctx).params;

  const set = await prisma.vocabSet.findUnique({ where: { id: vocabSetId }, select: { id: true } });
  if (!set) return apiError('Not found', 404);

  const results = await Promise.all(
    MODES.map((mode) =>
      prisma.gameScore.findMany({
        where:   { vocabSetId, mode },
        orderBy: { score: 'desc' },
        take:    TOP_N,
        select:  { userId: true, userName: true, score: true, updatedAt: true },
      })
    )
  );

  const leaderboard = Object.fromEntries(
    MODES.map((mode, i) => [
      mode,
      results[i].map((entry, rank) => ({ rank: rank + 1, ...entry })),
    ])
  );

  return apiSuccess({ leaderboard });
});
