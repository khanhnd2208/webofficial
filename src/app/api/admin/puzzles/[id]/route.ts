/* Admin: get / update puzzle */
import type { Prisma } from '@prisma/client';
import { withAdmin, apiSuccess, apiError } from '@/lib/apiUtils';
import { getPuzzleById, updatePuzzleAdmin } from '@/services/puzzleService';
import { validatePuzzleFromJson } from '@/lib/puzzle/puzzleValidation';

type Ctx = { params: Promise<{ id: string }> };

export const GET = withAdmin(async (_request, _user, ctx) => {
  const { id } = await (ctx as Ctx).params;
  const puzzle = await getPuzzleById(id);
  if (!puzzle) return apiError('Not found', 404);
  return apiSuccess({
    id: puzzle.id,
    dateKey: puzzle.dateKey,
    title: puzzle.title,
    size: puzzle.size,
    layoutJson: puzzle.layoutJson,
    solutionJson: puzzle.solutionJson,
    difficulty: puzzle.difficulty,
    status: puzzle.status,
  });
});

export const PATCH = withAdmin(async (request, _user, ctx) => {
  const { id } = await (ctx as Ctx).params;
  const existing = await getPuzzleById(id);
  if (!existing) return apiError('Not found', 404);

  let body: Partial<{
    title: string;
    layoutJson: unknown;
    solutionJson: unknown;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    status: 'DRAFT' | 'VALIDATED' | 'PUBLISHED' | 'ARCHIVED';
  }>;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON', 400);
  }

  if (body.status === 'PUBLISHED' && existing.status !== 'VALIDATED' && existing.status !== 'PUBLISHED') {
    const v = validatePuzzleFromJson(
      body.layoutJson ?? existing.layoutJson,
      body.solutionJson ?? existing.solutionJson,
    );
    if (!v.ok) return apiError(v.errors.join('; '), 422);
  }

  if (body.status === 'VALIDATED') {
    const v = validatePuzzleFromJson(
      body.layoutJson ?? existing.layoutJson,
      body.solutionJson ?? existing.solutionJson,
    );
    if (!v.ok) return apiError(v.errors.join('; '), 422);
  }

  const patch: Parameters<typeof updatePuzzleAdmin>[1] = {
    title: body.title,
    difficulty: body.difficulty,
    status: body.status,
    ...(body.layoutJson !== undefined
      ? { layoutJson: body.layoutJson as Prisma.InputJsonValue }
      : {}),
    ...(body.solutionJson !== undefined
      ? { solutionJson: body.solutionJson as Prisma.InputJsonValue }
      : {}),
  };

  try {
    const updated = await updatePuzzleAdmin(id, patch, {
      skipValidation: body.status === 'DRAFT',
    });
    return apiSuccess({
      id: updated.id,
      status: updated.status,
      dateKey: updated.dateKey,
    });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : 'Update failed', 422);
  }
});
