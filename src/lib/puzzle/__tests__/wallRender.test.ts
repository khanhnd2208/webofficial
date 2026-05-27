import { describe, expect, it } from 'vitest';
import { createEmptyLayout } from '@/lib/puzzle/layoutUtils';
import { hasWallTop, hasWallLeft, hasWallBottom, hasWallRight } from '@/lib/puzzle/layoutUtils';

/**
 * UI (PuzzleBoard) uses these helpers — must match engine wall indices.
 */
describe('wall render semantics', () => {
  it('horizontalWalls[4][c] draws top border on row 4 cells', () => {
    const layout = createEmptyLayout(8);
    for (let c = 0; c < 8; c++) layout.horizontalWalls[4][c] = true;

    expect(hasWallTop(layout, 4, 0)).toBe(true);
    expect(hasWallTop(layout, 4, 7)).toBe(true);
    expect(hasWallBottom(layout, 3, 0)).toBe(true);
    expect(hasWallTop(layout, 3, 0)).toBe(false);
  });

  it('verticalWalls[r][4] draws left border on col 4 cells', () => {
    const layout = createEmptyLayout(8);
    for (let r = 0; r < 8; r++) layout.verticalWalls[r][4] = true;

    expect(hasWallLeft(layout, 0, 4)).toBe(true);
    expect(hasWallRight(layout, 0, 3)).toBe(true);
    expect(hasWallLeft(layout, 0, 3)).toBe(false);
  });

  it('8x8 quadrant seed walls render both midlines', () => {
    const layout = createEmptyLayout(8);
    for (let r = 0; r < 8; r++) layout.verticalWalls[r][4] = true;
    for (let c = 0; c < 8; c++) layout.horizontalWalls[4][c] = true;

    for (let c = 0; c < 8; c++) {
      expect(hasWallTop(layout, 4, c)).toBe(true);
    }
    for (let r = 0; r < 8; r++) {
      expect(hasWallLeft(layout, r, 4)).toBe(true);
    }
  });
});
