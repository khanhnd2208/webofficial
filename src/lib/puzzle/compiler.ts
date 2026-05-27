import type { DailyPuzzleLayout } from '@/types/puzzle';
import type { CellMeta, CompiledPuzzle, Segment } from '@/lib/puzzle/types';
import { cellKey } from '@/lib/puzzle/cellKey';
import { buildHorizontalSegments, buildVerticalSegments } from '@/lib/puzzle/segments';
import { isBlocked } from '@/lib/puzzle/layoutUtils';

export function compilePuzzle(layout: DailyPuzzleLayout): CompiledPuzzle {
  const { segments: horizontalSegments, cellToSegmentId: cellToHorizontalSegment } =
    buildHorizontalSegments(layout);
  const { segments: verticalSegments, cellToSegmentId: cellToVerticalSegment } =
    buildVerticalSegments(layout);

  const segmentById: Record<string, Segment> = {};
  for (const s of [...horizontalSegments, ...verticalSegments]) {
    segmentById[s.id] = s;
  }

  const cells: CellMeta[][] = [];
  const playableKeys: string[] = [];

  for (let r = 0; r < layout.size; r++) {
    cells[r] = [];
    for (let c = 0; c < layout.size; c++) {
      const key = cellKey(r, c);
      const blocked = isBlocked(layout, r, c);
      const givenValue = layout.givens[key];
      const isGiven = givenValue !== undefined;

      let hSegmentId: string | undefined;
      let vSegmentId: string | undefined;
      let hSegmentLength: number | undefined;
      let vSegmentLength: number | undefined;
      let maxAllowedValue: number | undefined;

      if (!blocked) {
        hSegmentId = cellToHorizontalSegment[key];
        vSegmentId = cellToVerticalSegment[key];
        hSegmentLength = hSegmentId ? segmentById[hSegmentId].length : undefined;
        vSegmentLength = vSegmentId ? segmentById[vSegmentId].length : undefined;
        if (hSegmentLength !== undefined && vSegmentLength !== undefined) {
          maxAllowedValue = Math.min(hSegmentLength, vSegmentLength);
        }
        playableKeys.push(key);
      }

      cells[r][c] = {
        row: r,
        col: c,
        key,
        isBlocked: blocked,
        isGiven,
        givenValue,
        hSegmentId,
        vSegmentId,
        hSegmentLength,
        vSegmentLength,
        maxAllowedValue,
      };
    }
  }

  return {
    layout,
    cells,
    horizontalSegments,
    verticalSegments,
    cellToHorizontalSegment,
    cellToVerticalSegment,
    segmentById,
    playableKeys,
  };
}

export function getCellMeta(compiled: CompiledPuzzle, key: string): CellMeta | null {
  const parts = key.split(',');
  if (parts.length !== 2) return null;
  const r = Number(parts[0]);
  const c = Number(parts[1]);
  return compiled.cells[r]?.[c] ?? null;
}
