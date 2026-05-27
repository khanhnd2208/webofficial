import { describe, expect, it } from 'vitest';
import { createEmptyLayout } from '@/lib/puzzle/layoutUtils';
import { compilePuzzle } from '@/lib/puzzle/compiler';
import { findFirstSolution, hasUniqueSolution } from '@/lib/puzzle/solver';
import { pickGivensForUnique } from '@/lib/puzzle/givenPicker';

describe('pickGivensForUnique', () => {
  it('produces unique givens with deterministic seedKey', () => {
    const layout = createEmptyLayout(4);
    for (let r = 0; r < 4; r++) layout.verticalWalls[r][2] = true;
    for (let c = 0; c < 4; c++) layout.horizontalWalls[2][c] = true;

    const compiled = compilePuzzle(layout);
    const solved = findFirstSolution(compiled)!;
    const solution: Record<string, number> = {};
    for (const key of compiled.playableKeys) {
      solution[key] = solved[key]!;
    }

    const layoutA = createEmptyLayout(4);
    for (let r = 0; r < 4; r++) layoutA.verticalWalls[r][2] = true;
    for (let c = 0; c < 4; c++) layoutA.horizontalWalls[2][c] = true;

    const g1 = pickGivensForUnique(layoutA, solution, { seedKey: 'day-a' });
    expect(hasUniqueSolution(compilePuzzle({ ...layoutA, givens: g1 }))).toBe(true);

    const layoutB = createEmptyLayout(4);
    for (let r = 0; r < 4; r++) layoutB.verticalWalls[r][2] = true;
    for (let c = 0; c < 4; c++) layoutB.horizontalWalls[2][c] = true;
    const g2 = pickGivensForUnique(layoutB, solution, { seedKey: 'day-b' });
    expect(Object.keys(g1).sort().join()).not.toBe(Object.keys(g2).sort().join());
  });
});
