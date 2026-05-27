import type { DailyPuzzleLayout, PuzzleSolution } from '@/types/puzzle';
import { compilePuzzle } from '@/lib/puzzle/compiler';
import { validateLayout, validateGivens, validateFullSolution } from '@/lib/puzzle/validator';
import { parseLayoutJson } from '@/lib/puzzle/serializer';
import { assessLayoutQuality } from '@/lib/puzzle/layoutQuality';
import { evaluateDifficulty } from '@/lib/puzzle/difficultyEvaluator';
import {
  getSegmentFeasibilityErrors,
  getSegmentGivensFeasibilityErrors,
} from '@/lib/puzzle/segmentFeasibility';
import type { CompiledPuzzle } from '@/lib/puzzle/types';
import { SolverBudgetExceededError, countSolutions } from '@/lib/puzzle/solver';
import {
  solverBudgetForProfile,
  type PuzzleKind,
  type SolverLimitProfile,
} from '@/lib/puzzle/puzzlePolicy';

export interface ValidatePuzzleOptions {
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  puzzleKind?: PuzzleKind;
  solverProfile?: SolverLimitProfile;
  requireOneUpDemonstration?: boolean;
}

export interface PuzzleValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  solutionCount?: number;
  difficultyScore?: number;
  requiresGuessing?: boolean;
}

function hasCrossSegmentDuplicateInSolution(
  solution: PuzzleSolution,
  compiled: CompiledPuzzle,
): boolean {
  const { size } = compiled.layout;

  for (let r = 0; r < size; r++) {
    const valueToHSegments = new Map<number, Set<string>>();
    for (let c = 0; c < size; c++) {
      const meta = compiled.cells[r][c];
      if (!meta || meta.isBlocked || !meta.hSegmentId) continue;
      const v = solution[meta.key];
      if (v == null) continue;
      if (!valueToHSegments.has(v)) valueToHSegments.set(v, new Set());
      valueToHSegments.get(v)!.add(meta.hSegmentId);
    }
    for (const segs of valueToHSegments.values()) {
      if (segs.size >= 2) return true;
    }
  }

  for (let c = 0; c < size; c++) {
    const valueToVSegments = new Map<number, Set<string>>();
    for (let r = 0; r < size; r++) {
      const meta = compiled.cells[r][c];
      if (!meta || meta.isBlocked || !meta.vSegmentId) continue;
      const v = solution[meta.key];
      if (v == null) continue;
      if (!valueToVSegments.has(v)) valueToVSegments.set(v, new Set());
      valueToVSegments.get(v)!.add(meta.vSegmentId);
    }
    for (const segs of valueToVSegments.values()) {
      if (segs.size >= 2) return true;
    }
  }

  return false;
}

export function validatePuzzleForPublish(
  layout: DailyPuzzleLayout,
  solution: PuzzleSolution,
  options: ValidatePuzzleOptions = {},
): PuzzleValidationResult {
  const errors: string[] = [];
  const puzzleKind = options.puzzleKind ?? 'DAILY';
  const difficulty = options.difficulty ?? 'MEDIUM';
  const solverBudget = solverBudgetForProfile(options.solverProfile ?? 'publish');
  const requireOneUp = options.requireOneUpDemonstration ?? false;

  const layoutErr = validateLayout(layout);
  if (layoutErr) errors.push(`Layout: ${layoutErr}`);

  const compiled = compilePuzzle(layout);

  const feasibilityErrors = getSegmentFeasibilityErrors(compiled);
  if (feasibilityErrors.length > 0) {
    errors.push(...feasibilityErrors.map((e) => `Segment feasibility: ${e}`));
  }

  const givensErr = validateGivens(compiled);
  if (givensErr) errors.push(`Givens: ${givensErr}`);
  else {
    const givensFeasibility = getSegmentGivensFeasibilityErrors(compiled);
    if (givensFeasibility.length > 0) {
      errors.push(...givensFeasibility.map((e) => `Givens feasibility: ${e}`));
    }
  }

  const solErr = validateFullSolution(solution, layout);
  if (solErr) errors.push(`Solution: ${solErr}`);

  let solutionCount = 0;
  if (feasibilityErrors.length === 0) {
    try {
      solutionCount = countSolutions(compiled, undefined, 2, solverBudget);
    } catch (e) {
      if (e instanceof SolverBudgetExceededError) {
        errors.push(`${e.code}: ${e.message}`);
      } else {
        throw e;
      }
    }
  }
  if (feasibilityErrors.length === 0 && solutionCount === 0 && !errors.some((x) => x.includes('SOLVER_TIMEOUT'))) {
    errors.push('Puzzle has no solution');
  } else if (solutionCount >= 2) {
    errors.push('Puzzle has multiple solutions');
  }

  const quality = assessLayoutQuality(layout, undefined, { difficulty, puzzleKind });
  errors.push(...quality.errors);
  const warnings = [...quality.warnings];

  const difficultyTrace = evaluateDifficulty(compiled);
  if (difficultyTrace.requiresGuessing) {
    warnings.push(
      'Difficulty trace required guessing — puzzle may be too hard for logic-only daily play.',
    );
  }
  if (difficultyTrace.score < 3 && layout.size >= 5) {
    warnings.push(`Low difficulty score (${difficultyTrace.score}) — puzzle may be too easy.`);
  }

  const hasOneUpDemo = hasCrossSegmentDuplicateInSolution(solution, compiled);
  if (!hasOneUpDemo && layout.size >= 4) {
    const msg =
      'Solution has no duplicate values across different segments in the same row/column — may feel like Latin square, not One-Up.';
    if (requireOneUp) errors.push(msg);
    else warnings.push(msg);
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    solutionCount,
    difficultyScore: difficultyTrace.score,
    requiresGuessing: difficultyTrace.requiresGuessing,
  };
}

export function validatePuzzleFromJson(
  layoutJson: unknown,
  solutionJson: unknown,
  options?: ValidatePuzzleOptions,
): PuzzleValidationResult {
  const layout = parseLayoutJson(layoutJson);
  const solution = solutionJson as PuzzleSolution;
  return validatePuzzleForPublish(layout, solution, options);
}
