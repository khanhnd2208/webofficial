/* Admin: list / create puzzles */
import type { Prisma } from '@prisma/client';
import { withAdmin, apiSuccess, apiError } from '@/lib/apiUtils';
import { listPuzzlesAdmin, createPuzzleAdmin } from '@/services/puzzleService';
import { validatePuzzleFromJson } from '@/lib/puzzle/puzzleValidation';
import { parseLayoutJson } from '@/lib/puzzle/serializer';
import type { PuzzleSolution } from '@/types/puzzle';

export const GET = withAdmin(async () => {
  const puzzles = await listPuzzlesAdmin();
  return apiSuccess(puzzles);
});

export const POST = withAdmin(async (request, user) => {
  let body: {
    dateKey: string;
    title: string;
    layout: unknown;
    solution: unknown;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    status?: 'DRAFT' | 'VALIDATED' | 'PUBLISHED';
  };
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON', 400);
  }

  if (!body.dateKey || !body.title || !body.layout || !body.solution) {
    return apiError('Missing required fields', 400);
  }

  const status = body.status ?? 'DRAFT';
  if (status === 'VALIDATED' || status === 'PUBLISHED') {
    const v = validatePuzzleFromJson(body.layout, body.solution);
    if (!v.ok) return apiError(v.errors.join('; '), 422);
  }

  const layout = parseLayoutJson(body.layout);
  const created = await createPuzzleAdmin({
    dateKey: body.dateKey,
    title: body.title,
    layout: layout as unknown as Prisma.InputJsonValue,
    solution: body.solution as unknown as Prisma.InputJsonValue,
    difficulty: body.difficulty,
    status,
    createdBy: user.id,
    skipValidation: status === 'DRAFT',
  });

  return apiSuccess({ id: created.id, dateKey: created.dateKey }, 201);
});
