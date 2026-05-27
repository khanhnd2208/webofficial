import type { CompiledPuzzle } from '@/lib/puzzle/types';
import { getCandidates } from '@/lib/puzzle/candidates';
import { isSolved } from '@/lib/puzzle/validator';

export interface DifficultyMetrics {
  /** Total cell assignments during logical + minimal branching solve trace. */
  placementSteps: number;
  /** Assignments where only one candidate existed. */
  forcedPlacements: number;
  /** Assignments where multiple candidates existed (branching). */
  branchPlacements: number;
  /** Max candidate count at a branching step. */
  maxBranchWidth: number;
  /** Heuristic score — higher = harder. */
  score: number;
  /** True if logical trace got stuck before full grid. */
  requiresGuessing: boolean;
}

function getMeta(compiled: CompiledPuzzle, key: string) {
  return compiled.cells.flat().find((c) => c?.key === key) ?? null;
}

function findMrvCell(
  state: Record<string, number | undefined>,
  compiled: CompiledPuzzle,
): { key: string; candidates: number[] } | null {
  let best: { key: string; candidates: number[] } | null = null;
  for (const key of compiled.playableKeys) {
    if (state[key] != null) continue;
    const meta = getMeta(compiled, key);
    if (!meta || meta.isGiven) continue;
    const candidates = getCandidates(state, meta, compiled);
    if (candidates.length === 0) return { key, candidates: [] };
    if (!best || candidates.length < best.candidates.length) {
      best = { key, candidates };
    }
  }
  return best;
}

/**
 * Simulates a human-style solve from givens: propagate singles, then MRV + first branch.
 * Not a full search — used for relative difficulty scoring between puzzles.
 */
export function evaluateDifficulty(compiled: CompiledPuzzle): DifficultyMetrics {
  const state: Record<string, number | undefined> = {};
  for (const key of compiled.playableKeys) {
    state[key] = compiled.layout.givens[key] ?? undefined;
  }

  let placementSteps = 0;
  let forcedPlacements = 0;
  let branchPlacements = 0;
  let maxBranchWidth = 0;

  while (!isSolved(state, compiled)) {
    let progressed = false;

    for (const key of compiled.playableKeys) {
      if (state[key] != null) continue;
      const meta = getMeta(compiled, key);
      if (!meta) continue;
      const candidates = getCandidates(state, meta, compiled);
      if (candidates.length === 1) {
        state[key] = candidates[0];
        placementSteps++;
        forcedPlacements++;
        progressed = true;
      }
    }

    if (isSolved(state, compiled)) break;
    if (progressed) continue;

    const next = findMrvCell(state, compiled);
    if (!next || next.candidates.length === 0) {
      return {
        placementSteps,
        forcedPlacements,
        branchPlacements,
        maxBranchWidth,
        score: placementSteps + branchPlacements * 3,
        requiresGuessing: true,
      };
    }

    maxBranchWidth = Math.max(maxBranchWidth, next.candidates.length);
    if (next.candidates.length > 1) {
      branchPlacements++;
    } else {
      forcedPlacements++;
    }
    state[next.key] = next.candidates[0];
    placementSteps++;
  }

  const score =
    placementSteps + branchPlacements * 4 + Math.max(0, maxBranchWidth - 2) * 2;

  return {
    placementSteps,
    forcedPlacements,
    branchPlacements,
    maxBranchWidth,
    score,
    requiresGuessing: false,
  };
}
