import type { CompiledPuzzle } from '@/lib/puzzle/types';
import type { PuzzleSolution } from '@/types/puzzle';

export function countEmptyPlayableCells(
  entries: PuzzleSolution,
  compiled: CompiledPuzzle,
): number {
  let n = 0;
  for (const key of compiled.playableKeys) {
    const v = entries[key];
    if (!Number.isInteger(v) || (v as number) < 1) n++;
  }
  return n;
}
