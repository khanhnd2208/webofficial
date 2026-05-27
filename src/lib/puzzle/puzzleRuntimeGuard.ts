import type { DailyPuzzleLayout, PuzzleSolution } from '@/types/puzzle';
import { parseLayoutJson } from '@/lib/puzzle/serializer';
import { validatePuzzleForPublish, type PuzzleValidationResult } from '@/lib/puzzle/puzzleValidation';
import {
  PUZZLE_VALIDATOR_VERSION,
  hashLayoutJson,
  hashSolutionJson,
  type PuzzleKind,
} from '@/lib/puzzle/puzzlePolicy';

export type PuzzleValidationStatus = 'PENDING' | 'VALID' | 'INVALID';

export interface StoredPuzzleRow {
  layoutJson: unknown;
  solutionJson: unknown;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  validatorVersion?: string | null;
  validationStatus?: string | null;
  layoutHash?: string | null;
  solutionHash?: string | null;
  puzzleKind?: string | null;
}

export interface RuntimeGuardResult {
  safe: boolean;
  result: PuzzleValidationResult;
  layout: DailyPuzzleLayout;
  solution: PuzzleSolution;
  puzzleKind: PuzzleKind;
}

export function resolvePuzzleKind(raw?: string | null): PuzzleKind {
  return raw === 'TUTORIAL' ? 'TUTORIAL' : 'DAILY';
}

export function validateStoredPuzzle(row: StoredPuzzleRow): RuntimeGuardResult {
  const layout = parseLayoutJson(row.layoutJson);
  const solution = row.solutionJson as PuzzleSolution;
  const puzzleKind = resolvePuzzleKind(row.puzzleKind);

  const result = validatePuzzleForPublish(layout, solution, {
    difficulty: row.difficulty,
    puzzleKind,
    solverProfile: 'publish',
  });

  return { safe: result.ok, result, layout, solution, puzzleKind };
}

export function isStoredMetadataCurrent(row: StoredPuzzleRow, layout: DailyPuzzleLayout, solution: PuzzleSolution): boolean {
  if (row.validatorVersion !== PUZZLE_VALIDATOR_VERSION) return false;
  if (row.validationStatus !== 'VALID') return false;
  const lh = hashLayoutJson(layout);
  const sh = hashSolutionJson(solution);
  if (row.layoutHash && row.layoutHash !== lh) return false;
  if (row.solutionHash && row.solutionHash !== sh) return false;
  return true;
}

/** Catalog list — avoid running solver on every row; hide only explicit INVALID or broken JSON. */
export function isPuzzleCatalogVisible(
  row: StoredPuzzleRow & { status?: string },
): boolean {
  if (row.status && row.status !== 'PUBLISHED') return false;
  if (row.validationStatus === 'INVALID') return false;
  try {
    parseLayoutJson(row.layoutJson);
    return true;
  } catch {
    return false;
  }
}

/**
 * Play/today/start — full publish gate (feasibility + unique + quality).
 */
export function isPuzzleRuntimeSafe(row: StoredPuzzleRow): boolean {
  try {
    const layout = parseLayoutJson(row.layoutJson);
    const solution = row.solutionJson as PuzzleSolution;
    if (isStoredMetadataCurrent(row, layout, solution)) return true;
    return validateStoredPuzzle(row).safe;
  } catch {
    return false;
  }
}

export function publishMetadataFromValidation(
  layout: DailyPuzzleLayout,
  solution: PuzzleSolution,
  validationOk: boolean,
) {
  return {
    validatorVersion: PUZZLE_VALIDATOR_VERSION,
    validatedAt: new Date(),
    layoutHash: hashLayoutJson(layout),
    solutionHash: hashSolutionJson(solution),
    validationStatus: validationOk ? ('VALID' as const) : ('INVALID' as const),
  };
}
