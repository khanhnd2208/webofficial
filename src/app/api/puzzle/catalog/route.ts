/* GET /api/puzzle/catalog — Published puzzles for player selection */
import { withErrorHandling, apiSuccess } from '@/lib/apiUtils';
import { getApiUser } from '@/lib/apiAuth';
import { getPuzzleCatalogDiagnostics, listPublishedPuzzlesCatalog } from '@/services/puzzleService';
import { getPuzzleDateKey } from '@/lib/puzzle/dateKey';

export const GET = withErrorHandling(async (request) => {
  const user = await getApiUser(request);
  const puzzles = await listPublishedPuzzlesCatalog(user?.id);
  const bySize = new Map<number, string>();
  for (const p of puzzles) {
    if (p.size === 8 && !bySize.has(8)) bySize.set(8, p.id);
  }
  const diagnostics = getPuzzleCatalogDiagnostics(puzzles.map((p) => p.size), bySize);
  return apiSuccess({
    puzzles,
    todayDateKey: getPuzzleDateKey(),
    featured8x8PuzzleId: diagnostics.featured8x8PuzzleId,
    diagnostics,
  });
});
