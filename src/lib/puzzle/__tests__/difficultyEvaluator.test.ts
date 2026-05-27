import { describe, expect, it } from 'vitest';
import { createEmptyLayout } from '@/lib/puzzle/layoutUtils';
import { compilePuzzle } from '@/lib/puzzle/compiler';
import { findFirstSolution } from '@/lib/puzzle/solver';
import { pickGivensForUnique } from '@/lib/puzzle/givenPicker';
import { evaluateDifficulty } from '@/lib/puzzle/difficultyEvaluator';

describe('evaluateDifficulty', () => {
  it('returns metrics for a solved 4x4 quadrant puzzle', () => {
    const layout = createEmptyLayout(4);
    for (let r = 0; r < 4; r++) layout.verticalWalls[r][2] = true;
    for (let c = 0; c < 4; c++) layout.horizontalWalls[2][c] = true;

    const compiled = compilePuzzle(layout);
    const solved = findFirstSolution(compiled)!;
    const solution: Record<string, number> = {};
    for (const key of compiled.playableKeys) solution[key] = solved[key]!;

    layout.givens = pickGivensForUnique(layout, solution, { seedKey: 'test' });
    const metrics = evaluateDifficulty(compilePuzzle(layout));

    expect(metrics.placementSteps).toBeGreaterThan(0);
    expect(metrics.score).toBeGreaterThanOrEqual(0);
    expect(metrics.requiresGuessing).toBe(false);
  });
});
