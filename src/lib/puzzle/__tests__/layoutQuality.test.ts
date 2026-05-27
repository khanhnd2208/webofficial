import { describe, expect, it } from 'vitest';
import { createEmptyLayout } from '@/lib/puzzle/layoutUtils';
import { assessLayoutQuality } from '@/lib/puzzle/layoutQuality';

describe('layoutQuality', () => {
  it('warns and errors on empty 5x5 with no walls', () => {
    const layout = createEmptyLayout(5);
    const report = assessLayoutQuality(layout);
    expect(report.warnings.length).toBeGreaterThan(0);
    expect(report.errors.length).toBeGreaterThan(0);
    expect(report.internalWallCount).toBe(0);
  });

  it('4x4 quadrant passes quality gate as TUTORIAL', () => {
    const layout = createEmptyLayout(4);
    for (let r = 0; r < 4; r++) layout.verticalWalls[r][2] = true;
    for (let c = 0; c < 4; c++) layout.horizontalWalls[2][c] = true;
    const report = assessLayoutQuality(layout, undefined, { puzzleKind: 'TUTORIAL' });
    expect(report.ok).toBe(true);
  });

  it('rejects 8x8 vertical-only split', () => {
    const layout = createEmptyLayout(8);
    for (let r = 0; r < 8; r++) layout.verticalWalls[r][4] = true;
    layout.blocked[3][3] = true;
    const report = assessLayoutQuality(layout);
    expect(report.ok).toBe(false);
    expect(report.errors.some((e) => e.includes('cannot place value 5'))).toBe(true);
    expect(report.errors.some((e) => e.includes('cannot place value 5'))).toBe(true);
  });

  it('4x4 quadrant layout has internal walls', () => {
    const layout = createEmptyLayout(4);
    for (let r = 0; r < 4; r++) layout.verticalWalls[r][2] = true;
    for (let c = 0; c < 4; c++) layout.horizontalWalls[2][c] = true;
    const report = assessLayoutQuality(layout);
    expect(report.internalWallCount).toBeGreaterThan(0);
  });
});
