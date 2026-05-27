import { describe, expect, it } from 'vitest';
import { createEmptyLayout } from '@/lib/puzzle/layoutUtils';
import { compilePuzzle } from '@/lib/puzzle/compiler';
import { findFirstSolution } from '@/lib/puzzle/solver';
import { pickGivensForUnique } from '@/lib/puzzle/givenPicker';
import { validatePuzzleForPublish } from '@/lib/puzzle/puzzleValidation';

describe('validatePuzzleForPublish', () => {
  it('passes 4x4 quadrant seed layout with difficulty score', () => {
    const layout = createEmptyLayout(4);
    for (let r = 0; r < 4; r++) layout.verticalWalls[r][2] = true;
    for (let c = 0; c < 4; c++) layout.horizontalWalls[2][c] = true;

    const compiled = compilePuzzle(layout);
    const solved = findFirstSolution(compiled)!;
    const solution: Record<string, number> = {};
    for (const key of compiled.playableKeys) solution[key] = solved[key]!;

    layout.givens = pickGivensForUnique(layout, solution, { seedKey: 'test' });

    const result = validatePuzzleForPublish(layout, solution, { puzzleKind: 'TUTORIAL' });
    expect(result.ok, result.errors.join('; ')).toBe(true);
    expect(result.solutionCount).toBe(1);
    expect(result.difficultyScore).toBeGreaterThanOrEqual(0);
  });

  it('fails empty 5x5 with no walls (quality gate)', () => {
    const layout = createEmptyLayout(5);
    const compiled = compilePuzzle(layout);
    const solved = findFirstSolution(compiled);
    if (!solved) return;
    const solution: Record<string, number> = {};
    for (const key of compiled.playableKeys) solution[key] = solved[key]!;

    const result = validatePuzzleForPublish(layout, solution);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('wall') || e.includes('blocked'))).toBe(true);
  });
});
