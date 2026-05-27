import type { DailyPuzzleLayout } from '@/types/puzzle';
import { cellKey } from '@/lib/puzzle/cellKey';

/** Create empty layout with outer walls set. */
export function createEmptyLayout(size: number): DailyPuzzleLayout {
  const blocked = Array.from({ length: size }, () => Array(size).fill(false));
  const verticalWalls = Array.from({ length: size }, () => Array(size + 1).fill(false));
  const horizontalWalls = Array.from({ length: size + 1 }, () => Array(size).fill(false));

  for (let r = 0; r < size; r++) {
    verticalWalls[r][0] = true;
    verticalWalls[r][size] = true;
  }
  for (let c = 0; c < size; c++) {
    horizontalWalls[0][c] = true;
    horizontalWalls[size][c] = true;
  }

  return { size, blocked, verticalWalls, horizontalWalls, givens: {} };
}

export function isBlocked(layout: DailyPuzzleLayout, row: number, col: number): boolean {
  return layout.blocked[row]?.[col] === true;
}

/** verticalWalls[r][c] = wall on the left edge of cell (r,c) */
export function hasWallLeft(layout: DailyPuzzleLayout, row: number, col: number): boolean {
  return layout.verticalWalls[row]?.[col] === true;
}

/** Wall between (r,c) and (r,c+1) */
export function hasWallRight(layout: DailyPuzzleLayout, row: number, col: number): boolean {
  return layout.verticalWalls[row]?.[col + 1] === true;
}

/** horizontalWalls[r][c] = wall on the top edge of cell (r,c) */
export function hasWallTop(layout: DailyPuzzleLayout, row: number, col: number): boolean {
  return layout.horizontalWalls[row]?.[col] === true;
}

/** Wall between (r,c) and (r+1,c) */
export function hasWallBottom(layout: DailyPuzzleLayout, row: number, col: number): boolean {
  return layout.horizontalWalls[row + 1]?.[col] === true;
}

/** Wall between cell(r,c) and cell(r,c+1) — verticalWalls[r][c+1] */
export function hasVerticalWallBetween(
  layout: DailyPuzzleLayout,
  row: number,
  col: number,
  colNext: number,
): boolean {
  if (colNext !== col + 1) return true;
  return hasWallRight(layout, row, col);
}

/** Wall between cell(r,c) and cell(r+1,c) — horizontalWalls[r+1][c] */
export function hasHorizontalWallBetween(
  layout: DailyPuzzleLayout,
  row: number,
  rowNext: number,
  col: number,
): boolean {
  if (rowNext !== row + 1) return true;
  return hasWallBottom(layout, row, col);
}

export function getPlayableKeys(layout: DailyPuzzleLayout): string[] {
  const keys: string[] = [];
  for (let r = 0; r < layout.size; r++) {
    for (let c = 0; c < layout.size; c++) {
      if (!isBlocked(layout, r, c)) keys.push(cellKey(r, c));
    }
  }
  return keys;
}

/** Migrate legacy layout { blockedCells, walls.right/bottom } */
export function normalizeLayout(raw: unknown): DailyPuzzleLayout {
  const o = raw as Record<string, unknown>;
  const size = Number(o.size);
  if (!Number.isInteger(size) || size < 1) {
    throw new Error('Invalid layout: size');
  }

  if (Array.isArray(o.blocked) && Array.isArray(o.verticalWalls)) {
    const layout = o as unknown as DailyPuzzleLayout;
    ensureOuterWalls(layout);
    return layout;
  }

  const layout = createEmptyLayout(size);
  const blockedCells = (o.blockedCells as Array<[number, number]> | undefined) ?? [];
  for (const [r, c] of blockedCells) {
    if (r >= 0 && r < size && c >= 0 && c < size) layout.blocked[r][c] = true;
  }

  const walls = o.walls as { right?: string[]; bottom?: string[] } | undefined;
  for (const key of walls?.right ?? []) {
    const [r, c] = key.split(',').map(Number);
    if (c + 1 <= size) layout.verticalWalls[r][c + 1] = true;
  }
  for (const key of walls?.bottom ?? []) {
    const [r, c] = key.split(',').map(Number);
    if (r + 1 <= size) layout.horizontalWalls[r + 1][c] = true;
  }

  layout.givens = (o.givens as Record<string, number>) ?? {};
  ensureOuterWalls(layout);
  return layout;
}

export function ensureOuterWalls(layout: DailyPuzzleLayout): void {
  const { size } = layout;
  for (let r = 0; r < size; r++) {
    layout.verticalWalls[r][0] = true;
    layout.verticalWalls[r][size] = true;
  }
  for (let c = 0; c < size; c++) {
    layout.horizontalWalls[0][c] = true;
    layout.horizontalWalls[size][c] = true;
  }
}
