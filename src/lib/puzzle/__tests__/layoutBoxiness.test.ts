import { describe, expect, it } from 'vitest';
import { createEmptyLayout } from '@/lib/puzzle/layoutUtils';
import { assessBoxiness, detectFullCross } from '@/lib/puzzle/layoutBoxiness';
import { assessLayoutQuality } from '@/lib/puzzle/layoutQuality';

describe('layoutBoxiness', () => {
  it('detects full cross on 8x8 quadrant template', () => {
    const layout = createEmptyLayout(8);
    for (let r = 0; r < 8; r++) layout.verticalWalls[r][4] = true;
    for (let c = 0; c < 8; c++) layout.horizontalWalls[4][c] = true;
    expect(detectFullCross(layout)).toBe(true);
    const report = assessBoxiness(layout, 'DAILY');
    expect(report.errors.length).toBeGreaterThan(0);
    expect(report.errors.some((e) => e.includes('quadrant') || e.includes('cross'))).toBe(true);
  });

  it('rejects 8x8 full cross via layoutQuality for DAILY', () => {
    const layout = createEmptyLayout(8);
    for (let r = 0; r < 8; r++) layout.verticalWalls[r][4] = true;
    for (let c = 0; c < 8; c++) layout.horizontalWalls[4][c] = true;
    const report = assessLayoutQuality(layout, undefined, { puzzleKind: 'DAILY', difficulty: 'HARD' });
    expect(report.ok).toBe(false);
  });

  it('allows 4x4 quadrant for TUTORIAL with warning only', () => {
    const layout = createEmptyLayout(4);
    for (let r = 0; r < 4; r++) layout.verticalWalls[r][2] = true;
    for (let c = 0; c < 4; c++) layout.horizontalWalls[2][c] = true;
    const report = assessBoxiness(layout, 'TUTORIAL');
    expect(report.errors).toHaveLength(0);
  });
});
