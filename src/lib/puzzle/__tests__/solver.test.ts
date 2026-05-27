import { describe, it, expect } from 'vitest';
import { compilePuzzle } from '@/lib/puzzle/compiler';
import { createEmptyLayout } from '@/lib/puzzle/layoutUtils';
import { countSolutions, hasUniqueSolution } from '@/lib/puzzle/solver';
import type { PuzzleSolution } from '@/types/puzzle';

function puzzle3FullGivens() {
  const layout = createEmptyLayout(3);
  const solution: PuzzleSolution = {
    '0,0': 1, '0,1': 2, '0,2': 3,
    '1,0': 2, '1,1': 3, '1,2': 1,
    '2,0': 3, '2,1': 1, '2,2': 2,
  };
  layout.givens = { ...solution };
  return { layout, solution };
}

describe('solver', () => {
  it('full givens-free 3x3 has multiple solutions', () => {
    const layout = createEmptyLayout(3);
    const compiled = compilePuzzle(layout);
    expect(countSolutions(compiled, undefined, 2)).toBeGreaterThanOrEqual(2);
  });

  it('puzzle with full givens has unique solution', () => {
    const { layout } = puzzle3FullGivens();
    const compiled = compilePuzzle(layout);
    expect(hasUniqueSolution(compiled)).toBe(true);
  });

  it('conflicting givens yield zero solutions', () => {
    const layout = createEmptyLayout(3);
    layout.givens = { '0,0': 1, '0,1': 1 };
    const compiled = compilePuzzle(layout);
    expect(countSolutions(compiled, undefined, 2)).toBe(0);
  });
});
