/* POST /api/admin/puzzles/[id]/validate */
import { withAdmin, apiSuccess, apiError } from '@/lib/apiUtils';
import { getPuzzleById, updatePuzzleAdmin } from '@/services/puzzleService';
import { validatePuzzleFromJson } from '@/lib/puzzle/puzzleValidation';

type Ctx = { params: Promise<{ id: string }> };

export const POST = withAdmin(async (request, _user, ctx) => {
  const { id } = await (ctx as Ctx).params;
  const puzzle = await getPuzzleById(id);
  if (!puzzle) return apiError('Not found', 404);

  let body: { layoutJson?: unknown; solutionJson?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    /* empty body ok */
  }

  const layoutJson = body.layoutJson ?? puzzle.layoutJson;
  const solutionJson = body.solutionJson ?? puzzle.solutionJson;

  const v = validatePuzzleFromJson(layoutJson, solutionJson);
  if (!v.ok) {
    return apiSuccess({
      valid: false,
      errors: v.errors,
      solutionCount: v.solutionCount,
    });
  }

  await updatePuzzleAdmin(
    id,
    {
      layoutJson: layoutJson as object,
      solutionJson: solutionJson as object,
      status: 'VALIDATED',
    },
    { skipValidation: true },
  );

  return apiSuccess({
    valid: true,
    errors: [],
    solutionCount: v.solutionCount ?? 1,
  });
});
