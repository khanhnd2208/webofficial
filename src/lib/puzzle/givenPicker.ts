import type { DailyPuzzleLayout, PuzzleSolution } from '@/types/puzzle';
import { compilePuzzle } from '@/lib/puzzle/compiler';
import { hasUniqueSolution } from '@/lib/puzzle/solver';
import { deterministicShuffle } from '@/lib/puzzle/seedShuffle';

export interface PickGivensOptions {
  /** When set, shuffles solution keys before greedy add (reproducible per date). */
  seedKey?: string;
}

/**
 * Greedy + prune: add givens until unique, then remove redundant givens.
 * Optional deterministic shuffle avoids top-left bias in given placement.
 */
export function pickGivensForUnique(
  layout: DailyPuzzleLayout,
  solution: PuzzleSolution,
  options?: PickGivensOptions,
): Record<string, number> {
  const sorted = Object.keys(solution).sort();
  const keys = options?.seedKey ? deterministicShuffle(sorted, options.seedKey) : sorted;

  const givens: Record<string, number> = {};
  for (const key of keys) {
    givens[key] = solution[key];
    layout.givens = { ...givens };
    if (hasUniqueSolution(compilePuzzle(layout))) break;
  }

  if (!hasUniqueSolution(compilePuzzle(layout))) {
    throw new Error(`Givens did not yield unique solution (size ${layout.size})`);
  }

  const pruneOrder = options?.seedKey
    ? deterministicShuffle(Object.keys(givens), `${options.seedKey}:prune`)
    : Object.keys(givens);

  for (const key of pruneOrder) {
    const trial = { ...givens };
    delete trial[key];
    layout.givens = trial;
    if (hasUniqueSolution(compilePuzzle(layout))) {
      delete givens[key];
    } else {
      layout.givens = { ...givens };
    }
  }
  layout.givens = { ...givens };
  return givens;
}
