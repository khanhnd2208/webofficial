import type { DailyPuzzleLayout } from '@/types/puzzle';
import type { CellCoord, Segment } from '@/lib/puzzle/types';
import { cellKey } from '@/lib/puzzle/cellKey';
import { isBlocked, hasVerticalWallBetween, hasHorizontalWallBetween } from '@/lib/puzzle/layoutUtils';

export function buildHorizontalSegments(layout: DailyPuzzleLayout): {
  segments: Segment[];
  cellToSegmentId: Record<string, string>;
} {
  const segments: Segment[] = [];
  const cellToSegmentId: Record<string, string> = {};
  const { size } = layout;

  for (let r = 0; r < size; r++) {
    let c = 0;
    while (c < size) {
      if (isBlocked(layout, r, c)) {
        c++;
        continue;
      }

      const cells: CellCoord[] = [];
      while (c < size && !isBlocked(layout, r, c)) {
        cells.push({ row: r, col: c });

        const atLastCol = c === size - 1;
        if (atLastCol) break;

        const wallBetween = hasVerticalWallBetween(layout, r, c, c + 1);
        const nextBlocked = isBlocked(layout, r, c + 1);
        if (wallBetween || nextBlocked) break;

        c++;
      }

      const segment: Segment = {
        id: `H-${segments.length}`,
        direction: 'H',
        cells,
        length: cells.length,
      };
      segments.push(segment);
      for (const cell of cells) {
        cellToSegmentId[cellKey(cell.row, cell.col)] = segment.id;
      }
      c++;
    }
  }

  return { segments, cellToSegmentId };
}

export function buildVerticalSegments(layout: DailyPuzzleLayout): {
  segments: Segment[];
  cellToSegmentId: Record<string, string>;
} {
  const segments: Segment[] = [];
  const cellToSegmentId: Record<string, string> = {};
  const { size } = layout;

  for (let c = 0; c < size; c++) {
    let r = 0;
    while (r < size) {
      if (isBlocked(layout, r, c)) {
        r++;
        continue;
      }

      const cells: CellCoord[] = [];
      while (r < size && !isBlocked(layout, r, c)) {
        cells.push({ row: r, col: c });

        const atLastRow = r === size - 1;
        if (atLastRow) break;

        const wallBetween = hasHorizontalWallBetween(layout, r, r + 1, c);
        const nextBlocked = isBlocked(layout, r + 1, c);
        if (wallBetween || nextBlocked) break;

        r++;
      }

      const segment: Segment = {
        id: `V-${segments.length}`,
        direction: 'V',
        cells,
        length: cells.length,
      };
      segments.push(segment);
      for (const cell of cells) {
        cellToSegmentId[cellKey(cell.row, cell.col)] = segment.id;
      }
      r++;
    }
  }

  return { segments, cellToSegmentId };
}
