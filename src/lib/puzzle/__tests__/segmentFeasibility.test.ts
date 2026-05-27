import { describe, expect, it } from 'vitest';
import { createEmptyLayout } from '@/lib/puzzle/layoutUtils';
import { compilePuzzle } from '@/lib/puzzle/compiler';
import {
  explainLayoutFeasibility,
  getSegmentFeasibilityErrors,
  isSegmentDomainFeasible,
} from '@/lib/puzzle/segmentFeasibility';
import { buildSeedPuzzles } from '../../../../prisma/puzzle-seed-data';
import { validatePuzzleForPublish } from '@/lib/puzzle/puzzleValidation';

describe('segmentFeasibility', () => {
  it('rejects 8x8 with vertical split only (image-1 class bug)', () => {
    const layout = createEmptyLayout(8);
    for (let r = 0; r < 8; r++) layout.verticalWalls[r][4] = true;
    layout.blocked[3][3] = true;

    const compiled = compilePuzzle(layout);
    const errors = getSegmentFeasibilityErrors(compiled);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.includes('length 8') && e.includes('cannot place value 5'))).toBe(
      true,
    );

    const rows = explainLayoutFeasibility(compiled);
    const badV = rows.filter((r) => r.direction === 'V' && r.length >= 7 && !r.feasible);
    expect(badV.length).toBeGreaterThan(0);
    expect(badV[0].caps.every((c) => c <= 4)).toBe(true);
    expect(badV[0].caps[badV[0].caps.length - 1]).toBeLessThan(badV[0].length);
  });

  it('accepts 8x8 with both mid walls (four 4x4 quadrants)', () => {
    const layout = createEmptyLayout(8);
    for (let r = 0; r < 8; r++) layout.verticalWalls[r][4] = true;
    for (let c = 0; c < 8; c++) layout.horizontalWalls[4][c] = true;
    layout.blocked[3][3] = true;

    const compiled = compilePuzzle(layout);
    expect(getSegmentFeasibilityErrors(compiled)).toEqual([]);
    for (const seg of [...compiled.horizontalSegments, ...compiled.verticalSegments]) {
      expect(isSegmentDomainFeasible(compiled, seg)).toBe(true);
    }
  });

  it('seed day8 passes segment feasibility and publish gate', () => {
    const day8 = buildSeedPuzzles().find((p) => p.dateKey === '2026-05-26')!;
    const compiled = compilePuzzle(day8.layout);
    expect(getSegmentFeasibilityErrors(compiled)).toEqual([]);
    const result = validatePuzzleForPublish(day8.layout, day8.solution);
    expect(result.ok, result.errors.join('; ')).toBe(true);
  });
});
