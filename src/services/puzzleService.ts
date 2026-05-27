import { createHash } from 'crypto';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getPuzzleDateKey } from '@/lib/puzzle/dateKey';
import { parseLayoutJson, toPublicPuzzle } from '@/lib/puzzle/serializer';
import { compilePuzzle } from '@/lib/puzzle/compiler';
import {
  isSolved,
  isAnswerComplete,
  sanitizeUserValuesOnly,
  sanitizeNotesOnly,
  composeStateWithGivens,
  findConflictKeys,
} from '@/lib/puzzle/validator';
import {
  calcDurationMs,
  calcRankScore,
  buildShareText,
  MIN_SUBMIT_DURATION_MS,
} from '@/lib/puzzle/scoring';
import type { PuzzleNotes, PuzzleSolution } from '@/types/puzzle';
import { updatePuzzleStreak } from '@/services/puzzleStreakService';
import { validatePuzzleFromJson } from '@/lib/puzzle/puzzleValidation';
import { PUZZLE_SEED_8X8_DATE_KEYS, PUZZLE_SEED_PUBLISHED_COUNT } from '@/lib/puzzle/seedCatalogMeta';
import {
  isPuzzleCatalogVisible,
  isPuzzleRuntimeSafe,
  publishMetadataFromValidation,
  validateStoredPuzzle,
} from '@/lib/puzzle/puzzleRuntimeGuard';
import { PUZZLE_VALIDATOR_VERSION } from '@/lib/puzzle/puzzlePolicy';

const publishedPuzzleSelect = {
  id: true,
  dateKey: true,
  title: true,
  size: true,
  layoutJson: true,
  solutionJson: true,
  difficulty: true,
  status: true,
  puzzleKind: true,
  validatorVersion: true,
  validationStatus: true,
  layoutHash: true,
  solutionHash: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
} as const;

function logUnsafePuzzle(dateKey: string, id: string, reason: string) {
  console.error(`[ThinkGrid] Unsafe published puzzle hidden: ${dateKey} (${id}) — ${reason}`);
}

export async function getPublishedPuzzleByDateKey(dateKey: string) {
  const puzzle = await prisma.dailyPuzzle.findFirst({
    where: { dateKey, status: 'PUBLISHED' },
    select: publishedPuzzleSelect,
  });
  if (!puzzle) return null;
  if (!isPuzzleRuntimeSafe(puzzle)) {
    logUnsafePuzzle(puzzle.dateKey, puzzle.id, 'failed runtime validator');
    return null;
  }
  return puzzle;
}

export async function getPublishedPuzzleById(puzzleId: string) {
  const puzzle = await prisma.dailyPuzzle.findUnique({
    where: { id: puzzleId },
    select: publishedPuzzleSelect,
  });
  if (!puzzle || puzzle.status !== 'PUBLISHED') return null;
  if (!isPuzzleRuntimeSafe(puzzle)) {
    logUnsafePuzzle(puzzle.dateKey, puzzle.id, 'failed runtime validator');
    return null;
  }
  return puzzle;
}

function hashPuzzleState(state: PuzzleSolution): string {
  const keys = Object.keys(state).sort();
  const payload = keys.map((k) => `${k}:${state[k]}`).join('|');
  return createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

export async function getTodayPuzzle() {
  const dateKey = getPuzzleDateKey();
  return getPublishedPuzzleByDateKey(dateKey);
}

export async function getTodayPuzzlePublic() {
  const puzzle = await getTodayPuzzle();
  if (!puzzle) return null;
  return toPublicPuzzle(puzzle);
}

export async function getPuzzleById(id: string) {
  return prisma.dailyPuzzle.findUnique({ where: { id } });
}

export async function startAttempt(userId: string, userName: string, puzzleId: string) {
  if (!userId?.trim()) {
    throw new Error('Invalid user session');
  }

  const puzzle = await prisma.dailyPuzzle.findUnique({ where: { id: puzzleId } });
  if (!puzzle || puzzle.status !== 'PUBLISHED') {
    throw new Error('Puzzle not found');
  }

  const existing = await prisma.puzzleAttempt.findUnique({
    where: { userId_puzzleId: { userId, puzzleId } },
  });

  if (existing?.status === 'SOLVED') return existing;
  if (existing?.status === 'IN_PROGRESS') return existing;

  return prisma.puzzleAttempt.upsert({
    where: { userId_puzzleId: { userId, puzzleId } },
    create: {
      puzzleId,
      userId,
      userName,
      startedAt: new Date(),
      status: 'IN_PROGRESS',
      eligibleForLeaderboard: true,
    },
    update: {
      userName,
      startedAt: new Date(),
      submittedAt: null,
      durationMs: null,
      mistakes: 0,
      status: 'IN_PROGRESS',
      eligibleForLeaderboard: true,
    },
  });
}


export async function saveProgress(params: {
  userId: string;
  puzzleId: string;
  values: PuzzleSolution;
  notes?: PuzzleNotes;
}) {
  const attempt = await prisma.puzzleAttempt.findUnique({
    where: { userId_puzzleId: { userId: params.userId, puzzleId: params.puzzleId } },
  });
  if (!attempt || attempt.status !== 'IN_PROGRESS') {
    throw new Error('No active attempt');
  }

  const puzzle = await prisma.dailyPuzzle.findUnique({ where: { id: params.puzzleId } });
  if (!puzzle) throw new Error('Puzzle not found');

  const layout = parseLayoutJson(puzzle.layoutJson);
  const compiled = compilePuzzle(layout);
  const userValues = sanitizeUserValuesOnly(params.values, compiled);
  const cleanNotes = sanitizeNotesOnly(params.notes ?? {}, compiled);

  await prisma.puzzleAttempt.update({
    where: { id: attempt.id },
    data: {
      progressJson: userValues as unknown as Prisma.InputJsonValue,
      notesJson: cleanNotes as unknown as Prisma.InputJsonValue,
    },
  });

  return { values: userValues };
}

export async function submitAttempt(params: {
  userId: string;
  userName: string;
  puzzleId: string;
  answer: PuzzleSolution;
}) {
  const { userId, userName, puzzleId, answer } = params;

  const puzzle = await prisma.dailyPuzzle.findUnique({ where: { id: puzzleId } });
  if (!puzzle || puzzle.status !== 'PUBLISHED') {
    throw new Error('Puzzle not found');
  }

  const layout = parseLayoutJson(puzzle.layoutJson);
  const compiled = compilePuzzle(layout);
  const solution = puzzle.solutionJson as PuzzleSolution;
  const userValues = sanitizeUserValuesOnly(answer, compiled);
  const state = composeStateWithGivens(userValues, layout.givens);

  const attempt = await prisma.puzzleAttempt.findUnique({
    where: { userId_puzzleId: { userId, puzzleId } },
  });

  if (!attempt || attempt.status !== 'IN_PROGRESS') {
    if (attempt?.status === 'SOLVED') throw new Error('Already solved');
    throw new Error('No active attempt. Start attempt first.');
  }

  const submittedAt = new Date();
  const durationMs = calcDurationMs(attempt.startedAt, submittedAt);

  if (durationMs < MIN_SUBMIT_DURATION_MS) {
    throw new Error('Submit too fast');
  }

  if (!isAnswerComplete(state, compiled)) {
    return {
      correct: false,
      wrongCells: [] as string[],
      incomplete: true,
    };
  }

  const conflictKeys = findConflictKeys(state, compiled);
  if (conflictKeys.length > 0) {
    const newMistakes = attempt.mistakes + 1;
    await prisma.puzzleAttempt.update({
      where: { id: attempt.id },
      data: { mistakes: newMistakes },
    });
    return {
      correct: false,
      wrongCells: conflictKeys,
      incomplete: false,
      hasConflict: true,
    };
  }

  if (!isSolved(state, compiled)) {
    console.warn('[thinkgrid] complete_no_conflict_but_not_solved', {
      event: 'complete_no_conflict_but_not_solved',
      puzzleId,
      userId,
      dateKey: puzzle.dateKey,
      stateHash: hashPuzzleState(state),
      playableCount: compiled.playableKeys.length,
    });
    const newMistakes = attempt.mistakes + 1;
    await prisma.puzzleAttempt.update({
      where: { id: attempt.id },
      data: { mistakes: newMistakes },
    });
    // Do not return wrongCells vs solutionJson — avoids leaking the official answer.
    return { correct: false, wrongCells: [] as string[], incomplete: false };
  }

  const mistakes = attempt.mistakes;
  const rankScore = calcRankScore(durationMs, mistakes);

  const existingLeaderboard = await prisma.puzzleLeaderboardEntry.findUnique({
    where: { userId_puzzleId: { userId, puzzleId } },
  });

  const eligibleForLeaderboard = !existingLeaderboard;

  const updatedAttempt = await prisma.puzzleAttempt.update({
    where: { id: attempt.id },
    data: {
      status: 'SOLVED',
      submittedAt,
      durationMs,
      mistakes,
      userName,
      progressJson: userValues as unknown as Prisma.InputJsonValue,
      eligibleForLeaderboard,
    },
  });

  if (eligibleForLeaderboard) {
    await prisma.puzzleLeaderboardEntry.create({
      data: {
        puzzleId,
        userId,
        userName,
        durationMs,
        mistakes,
        rankScore,
      },
    });
  }

  const stats = await updatePuzzleStreak(userId, puzzle.dateKey);

  const puzzleCount = await prisma.dailyPuzzle.count({
    where: { status: 'PUBLISHED', dateKey: { lte: puzzle.dateKey } },
  });

  const shareText = buildShareText({
    puzzleNumber: puzzleCount,
    durationMs,
    mistakes,
    streak: stats.currentStreak,
  });

  return {
    correct: true,
    durationMs,
    mistakes,
    attempt: updatedAttempt,
    stats,
    shareText,
    wrongCells: [] as string[],
    incomplete: false,
  };
}

export async function getLeaderboard(puzzleId: string, limit = 10) {
  const entries = await prisma.puzzleLeaderboardEntry.findMany({
    where: { puzzleId },
    orderBy: { rankScore: 'asc' },
    take: limit,
  });

  return entries.map((e, i) => ({
    rank: i + 1,
    userId: e.userId,
    userName: e.userName,
    durationMs: e.durationMs,
    mistakes: e.mistakes,
    submittedAt: e.submittedAt.toISOString(),
  }));
}

export async function getLeaderboardByDate(dateKey: string, limit = 10) {
  const puzzle = await getPublishedPuzzleByDateKey(dateKey);
  if (!puzzle) return [];
  return getLeaderboard(puzzle.id, limit);
}

export async function getLeaderboardByPuzzleId(puzzleId: string, limit = 10) {
  const puzzle = await getPublishedPuzzleById(puzzleId);
  if (!puzzle) return [];
  return getLeaderboard(puzzle.id, limit);
}

export function getPuzzleCatalogDiagnostics(publishedSizes: number[], puzzleIdsBySize?: Map<number, string>) {
  const has8x8 = publishedSizes.some((s) => s === 8);
  const publishedCount = publishedSizes.length;
  return {
    missing8x8: PUZZLE_SEED_8X8_DATE_KEYS.length > 0 && !has8x8,
    expectedPublishedCount: PUZZLE_SEED_PUBLISHED_COUNT,
    publishedCount,
    seed8x8DateKeys: [...PUZZLE_SEED_8X8_DATE_KEYS],
    validatorVersion: PUZZLE_VALIDATOR_VERSION,
    setupRequired: publishedCount === 0,
    featured8x8PuzzleId: puzzleIdsBySize?.get(8) ?? null,
  };
}

export async function listPublishedPuzzlesCatalog(userId?: string) {
  const todayKey = getPuzzleDateKey();
  const rows = await prisma.dailyPuzzle.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: [{ size: 'desc' }, { dateKey: 'desc' }],
    select: publishedPuzzleSelect,
  });

  const puzzles = rows.filter((p) => {
    if (isPuzzleCatalogVisible(p)) return true;
    logUnsafePuzzle(p.dateKey, p.id, 'hidden from catalog');
    return false;
  });

  const statusByPuzzleId = new Map<string, string>();
  if (userId && puzzles.length > 0) {
    const attempts = await prisma.puzzleAttempt.findMany({
      where: { userId, puzzleId: { in: puzzles.map((p) => p.id) } },
      select: { puzzleId: true, status: true },
    });
    for (const a of attempts) statusByPuzzleId.set(a.puzzleId, a.status);
  }

  return puzzles.map((p) => ({
    id: p.id,
    dateKey: p.dateKey,
    title: p.title,
    size: p.size,
    difficulty: p.difficulty,
    puzzleKind: (p.puzzleKind === 'TUTORIAL' ? 'TUTORIAL' : 'DAILY') as 'DAILY' | 'TUTORIAL',
    isToday: p.dateKey === todayKey,
    attemptStatus: (statusByPuzzleId.get(p.id) as
      | 'IN_PROGRESS'
      | 'SOLVED'
      | 'FAILED'
      | 'ABANDONED'
      | undefined) ?? null,
  }));
}

export async function getUserAttemptForPuzzle(userId: string, puzzleId: string) {
  const puzzle = await getPublishedPuzzleById(puzzleId);
  if (!puzzle) return { puzzle: null, attempt: null };
  const attempt = await prisma.puzzleAttempt.findUnique({
    where: { userId_puzzleId: { userId, puzzleId: puzzle.id } },
  });
  return { puzzle, attempt };
}

export async function getUserAttemptForDate(userId: string, dateKey: string) {
  const puzzle = await getPublishedPuzzleByDateKey(dateKey);
  if (!puzzle) return { puzzle: null, attempt: null };
  const attempt = await prisma.puzzleAttempt.findUnique({
    where: { userId_puzzleId: { userId, puzzleId: puzzle.id } },
  });
  return { puzzle, attempt };
}

/** @deprecated Prefer getUserAttemptForDate with resolved dateKey */
export async function getUserAttemptForToday(userId: string) {
  const puzzle = await getTodayPuzzle();
  if (!puzzle) return { puzzle: null, attempt: null };
  return getUserAttemptForDate(userId, puzzle.dateKey);
}

export async function listPuzzlesAdmin() {
  return prisma.dailyPuzzle.findMany({
    orderBy: { dateKey: 'desc' },
    take: 50,
    select: {
      id: true,
      dateKey: true,
      title: true,
      size: true,
      difficulty: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function createPuzzleAdmin(data: {
  dateKey: string;
  title: string;
  layout: Prisma.InputJsonValue;
  solution: Prisma.InputJsonValue;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  status?: 'DRAFT' | 'VALIDATED' | 'PUBLISHED' | 'ARCHIVED';
  createdBy?: string;
  skipValidation?: boolean;
}) {
  const layout = parseLayoutJson(data.layout);
  const solution = data.solution as PuzzleSolution;

  const difficulty = data.difficulty ?? 'MEDIUM';
  const status = data.status ?? 'DRAFT';
  let meta: ReturnType<typeof publishMetadataFromValidation> | undefined;

  if (!data.skipValidation && status !== 'DRAFT') {
    const v = validatePuzzleFromJson(layout, solution, {
      difficulty,
      puzzleKind: 'DAILY',
      solverProfile: 'publish',
    });
    if (!v.ok) throw new Error(v.errors.join('; '));
    meta = publishMetadataFromValidation(layout, solution, true);
  }

  return prisma.dailyPuzzle.create({
    data: {
      dateKey: data.dateKey,
      title: data.title,
      size: layout.size,
      layoutJson: layout as unknown as Prisma.InputJsonValue,
      solutionJson: solution as unknown as Prisma.InputJsonValue,
      difficulty,
      puzzleKind: 'DAILY',
      status,
      createdBy: data.createdBy ?? 'admin',
      ...meta,
    },
  });
}

export async function updatePuzzleAdmin(
  id: string,
  data: Partial<{
    title: string;
    layoutJson: Prisma.InputJsonValue;
    solutionJson: Prisma.InputJsonValue;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    status: 'DRAFT' | 'VALIDATED' | 'PUBLISHED' | 'ARCHIVED';
  }>,
  options?: { skipValidation?: boolean },
) {
  const existing = await prisma.dailyPuzzle.findUnique({ where: { id } });
  if (!existing) throw new Error('Not found');

  const layoutJson = data.layoutJson ?? existing.layoutJson;
  const solutionJson = data.solutionJson ?? existing.solutionJson;
  const layout = parseLayoutJson(layoutJson);
  const solution = solutionJson as PuzzleSolution;

  const nextStatus = data.status ?? existing.status;
  const difficulty = data.difficulty ?? existing.difficulty;
  const puzzleKind =
    existing.puzzleKind === 'TUTORIAL' || existing.puzzleKind === 'DAILY'
      ? existing.puzzleKind
      : 'DAILY';

  if (
    !options?.skipValidation &&
    (nextStatus === 'VALIDATED' || nextStatus === 'PUBLISHED')
  ) {
    const v = validatePuzzleFromJson(layout, solution, {
      difficulty,
      puzzleKind,
      solverProfile: 'publish',
    });
    if (!v.ok) throw new Error(v.errors.join('; '));
  }

  if (nextStatus === 'PUBLISHED' && existing.status !== 'VALIDATED' && existing.status !== 'PUBLISHED') {
    const v = validatePuzzleFromJson(layout, solution, {
      difficulty,
      puzzleKind,
      solverProfile: 'publish',
    });
    if (!v.ok) throw new Error(v.errors.join('; '));
  }

  const update: Prisma.DailyPuzzleUpdateInput = {
    title: data.title,
    difficulty: data.difficulty,
    status: data.status,
    layoutJson: layout as unknown as Prisma.InputJsonValue,
    solutionJson: solution as unknown as Prisma.InputJsonValue,
    size: layout.size,
  };

  if (nextStatus === 'VALIDATED' || nextStatus === 'PUBLISHED') {
    const guard = validateStoredPuzzle({
      layoutJson: layout,
      solutionJson: solution,
      difficulty,
      puzzleKind,
    });
    if (!guard.safe) throw new Error(guard.result.errors.join('; '));
    Object.assign(update, publishMetadataFromValidation(layout, solution, true));
  }

  return prisma.dailyPuzzle.update({ where: { id }, data: update });
}

export async function validatePuzzleAdmin(id: string) {
  const puzzle = await prisma.dailyPuzzle.findUnique({ where: { id } });
  if (!puzzle) throw new Error('Not found');
  const puzzleKind = puzzle.puzzleKind === 'TUTORIAL' ? 'TUTORIAL' : 'DAILY';
  return validatePuzzleFromJson(puzzle.layoutJson, puzzle.solutionJson, {
    difficulty: puzzle.difficulty,
    puzzleKind,
    solverProfile: 'publish',
    requireOneUpDemonstration: puzzle.dateKey === '2026-05-19',
  });
}

/** Count published puzzles visible in catalog (for health checks). */
export async function countPublishedPuzzlesVisible(): Promise<number> {
  const rows = await prisma.dailyPuzzle.findMany({
    where: { status: 'PUBLISHED' },
    select: { layoutJson: true, solutionJson: true, difficulty: true, validationStatus: true, status: true, puzzleKind: true },
  });
  return rows.filter((r) => isPuzzleCatalogVisible(r)).length;
}
