import type { DailyPuzzleLayout } from '@/types/puzzle';

export type SegmentDirection = 'H' | 'V';

export interface CellCoord {
  row: number;
  col: number;
}

export interface Segment {
  id: string;
  direction: SegmentDirection;
  cells: CellCoord[];
  length: number;
}

export interface CellMeta {
  row: number;
  col: number;
  key: string;
  isBlocked: boolean;
  isGiven: boolean;
  givenValue?: number;
  hSegmentId?: string;
  vSegmentId?: string;
  hSegmentLength?: number;
  vSegmentLength?: number;
  maxAllowedValue?: number;
}

export interface CompiledPuzzle {
  layout: DailyPuzzleLayout;
  cells: CellMeta[][];
  horizontalSegments: Segment[];
  verticalSegments: Segment[];
  cellToHorizontalSegment: Record<string, string>;
  cellToVerticalSegment: Record<string, string>;
  segmentById: Record<string, Segment>;
  playableKeys: string[];
}
