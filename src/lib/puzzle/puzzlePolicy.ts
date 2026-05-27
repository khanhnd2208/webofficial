/**
 * ThinkGrid publish/runtime policy — bump version when validation rules change.
 */
import type { DailyPuzzleLayout, PuzzleSolution } from '@/types/puzzle';
import { createHash } from 'crypto';

export const PUZZLE_VALIDATOR_VERSION = '1.8.0';

export type PuzzleKind = 'DAILY' | 'TUTORIAL';

export const SOLVER_LIMITS = {
  publishMaxNodes: 250_000,
  publishMaxMs: 5_000,
  seedMaxNodes: 500_000,
  seedMaxMs: 15_000,
} as const;

export type SolverLimitProfile = 'publish' | 'seed';

export interface SolverBudget {
  maxNodes: number;
  maxMs: number;
}

export function solverBudgetForProfile(profile: 'publish' | 'seed'): SolverBudget {
  if (profile === 'seed') {
    return { maxNodes: SOLVER_LIMITS.seedMaxNodes, maxMs: SOLVER_LIMITS.seedMaxMs };
  }
  return { maxNodes: SOLVER_LIMITS.publishMaxNodes, maxMs: SOLVER_LIMITS.publishMaxMs };
}

export function maxGivenRatioFor(
  difficulty: 'EASY' | 'MEDIUM' | 'HARD',
  puzzleKind: PuzzleKind,
): number {
  if (puzzleKind === 'TUTORIAL') return 0.55;
  if (difficulty === 'EASY') return 0.45;
  if (difficulty === 'MEDIUM') return 0.38;
  return 0.32;
}

export function maxSegmentLength1RatioFor(puzzleKind: PuzzleKind): number {
  return puzzleKind === 'TUTORIAL' ? 0.42 : 0.3;
}

export function hashLayoutJson(layout: DailyPuzzleLayout): string {
  const payload = JSON.stringify({
    size: layout.size,
    blocked: layout.blocked,
    verticalWalls: layout.verticalWalls,
    horizontalWalls: layout.horizontalWalls,
    givens: layout.givens,
  });
  return createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

export function hashSolutionJson(solution: PuzzleSolution): string {
  const keys = Object.keys(solution).sort();
  const payload = keys.map((k) => `${k}:${solution[k]}`).join('|');
  return createHash('sha256').update(payload).digest('hex').slice(0, 16);
}
