import type { PuzzleState } from '@/types/puzzle';
import type { CellMeta, CompiledPuzzle, Segment } from '@/lib/puzzle/types';
import { cellKey } from '@/lib/puzzle/cellKey';

function segmentContainsValue(
  state: PuzzleState,
  segment: Segment,
  value: number,
  exceptKey?: string,
): boolean {
  for (const cell of segment.cells) {
    const key = cellKey(cell.row, cell.col);
    if (key === exceptKey) continue;
    const v = state[key];
    if (v === value) return true;
  }
  return false;
}

export function getCandidates(
  state: PuzzleState,
  cellMeta: CellMeta,
  compiled: CompiledPuzzle,
): number[] {
  if (cellMeta.isBlocked || cellMeta.isGiven) return [];
  if (!cellMeta.hSegmentId || !cellMeta.vSegmentId || !cellMeta.maxAllowedValue) return [];

  const hSeg = compiled.segmentById[cellMeta.hSegmentId];
  const vSeg = compiled.segmentById[cellMeta.vSegmentId];
  const max = cellMeta.maxAllowedValue;
  const candidates: number[] = [];

  for (let value = 1; value <= max; value++) {
    if (!segmentContainsValue(state, hSeg, value, cellMeta.key)) {
      if (!segmentContainsValue(state, vSeg, value, cellMeta.key)) {
        candidates.push(value);
      }
    }
  }
  return candidates;
}

export function numbersFrom1To(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i + 1);
}
