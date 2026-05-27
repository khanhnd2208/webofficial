/**
 * Anti-boxiness metrics — reject quadrant / full-cross daily templates.
 */
import type { DailyPuzzleLayout } from '@/types/puzzle';
import type { PuzzleKind } from '@/lib/puzzle/puzzlePolicy';
import { compilePuzzle } from '@/lib/puzzle/compiler';

export interface BoxinessReport {
  score: number;
  errors: string[];
  warnings: string[];
  maxVerticalWallColCoverage: number;
  maxHorizontalWallRowCoverage: number;
  hasFullCross: boolean;
  distinctSegmentLengths: number;
}

/** Max share of board span covered by one continuous internal wall line (DAILY). */
export const MAX_WALL_LINE_COVERAGE_RATIO = 0.55;

/** Min distinct segment lengths for daily grids ≥6. */
export const MIN_SEGMENT_LENGTH_VARIETY_DAILY = 3;

/** Max fraction of internal walls on a single column/row line. */
export const MAX_WALL_CONCENTRATION_RATIO = 0.6;

function maxInternalWallLineCoverage(layout: DailyPuzzleLayout, direction: 'vertical' | 'horizontal'): number {
  const size = layout.size;
  let best = 0;

  if (direction === 'vertical') {
    for (let c = 1; c < size; c++) {
      let run = 0;
      for (let r = 0; r < size; r++) {
        if (layout.verticalWalls[r][c]) run++;
        else run = 0;
        best = Math.max(best, run);
      }
    }
    return best / size;
  }

  for (let r = 1; r < size; r++) {
    let run = 0;
    for (let c = 0; c < size; c++) {
      if (layout.horizontalWalls[r][c]) run++;
      else run = 0;
      best = Math.max(best, run);
    }
  }
  return best / size;
}

/** True if one vertical and one horizontal wall span most of the board (quadrant template). */
export function detectFullCross(layout: DailyPuzzleLayout): boolean {
  const size = layout.size;
  const vCov = maxInternalWallLineCoverage(layout, 'vertical');
  const hCov = maxInternalWallLineCoverage(layout, 'horizontal');
  return vCov >= MAX_WALL_LINE_COVERAGE_RATIO && hCov >= MAX_WALL_LINE_COVERAGE_RATIO;
}

function wallConcentrationErrors(layout: DailyPuzzleLayout): string[] {
  const errors: string[] = [];
  const size = layout.size;
  const vByCol = new Array<number>(size + 1).fill(0);
  let vTotal = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 1; c < size; c++) {
      if (layout.verticalWalls[r][c]) {
        vByCol[c]++;
        vTotal++;
      }
    }
  }
  if (vTotal > 0) {
    const maxCol = Math.max(...vByCol);
    if (maxCol / vTotal > MAX_WALL_CONCENTRATION_RATIO) {
      errors.push(
        `Too many vertical walls on one column (${Math.round((maxCol / vTotal) * 100)}% of V walls).`,
      );
    }
    const colsUsed = vByCol.filter((n) => n > 0).length;
    if (colsUsed < 2 && vTotal >= 3) {
      errors.push('Vertical walls must span at least 2 different columns.');
    }
  }

  const hByRow = new Array<number>(size + 1).fill(0);
  let hTotal = 0;
  for (let r = 1; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (layout.horizontalWalls[r][c]) {
        hByRow[r]++;
        hTotal++;
      }
    }
  }
  if (hTotal > 0) {
    const maxRow = Math.max(...hByRow);
    if (maxRow / hTotal > MAX_WALL_CONCENTRATION_RATIO) {
      errors.push(
        `Too many horizontal walls on one row (${Math.round((maxRow / hTotal) * 100)}% of H walls).`,
      );
    }
    const rowsUsed = hByRow.filter((n) => n > 0).length;
    if (rowsUsed < 2 && hTotal >= 3) {
      errors.push('Horizontal walls must span at least 2 different wall rows.');
    }
  }

  return errors;
}

export interface BoxinessOptions {
  /** During wall-first build, skip until enough walls are placed. */
  requireSegmentVariety?: boolean;
  requireWallDistribution?: boolean;
}

export function assessBoxiness(
  layout: DailyPuzzleLayout,
  puzzleKind: PuzzleKind = 'DAILY',
  options: BoxinessOptions = {},
): BoxinessReport {
  const requireSegmentVariety = options.requireSegmentVariety ?? puzzleKind === 'DAILY';
  const requireWallDistribution = options.requireWallDistribution ?? puzzleKind === 'DAILY';
  const errors: string[] = [];
  const warnings: string[] = [];
  const size = layout.size;
  const vCov = maxInternalWallLineCoverage(layout, 'vertical');
  const hCov = maxInternalWallLineCoverage(layout, 'horizontal');
  const fullCross = detectFullCross(layout);

  const compiled = compilePuzzle(layout);
  const segLengths = new Set<number>();
  for (const seg of [...compiled.horizontalSegments, ...compiled.verticalSegments]) {
    segLengths.add(seg.length);
  }

  let score = 0;
  if (vCov >= 0.45) score += 25;
  if (hCov >= 0.45) score += 25;
  if (fullCross) score += 40;
  if (segLengths.size <= 2 && size >= 6) score += 20;

  if (puzzleKind === 'DAILY' && size >= 6) {
    if (vCov > MAX_WALL_LINE_COVERAGE_RATIO) {
      errors.push(
        `Vertical wall line covers ${Math.round(vCov * 100)}% of board height (max ${Math.round(MAX_WALL_LINE_COVERAGE_RATIO * 100)}%).`,
      );
    }
    if (hCov > MAX_WALL_LINE_COVERAGE_RATIO) {
      errors.push(
        `Horizontal wall line covers ${Math.round(hCov * 100)}% of board width (max ${Math.round(MAX_WALL_LINE_COVERAGE_RATIO * 100)}%).`,
      );
    }
    if (fullCross) {
      errors.push(
        'Full cross / quadrant template (long vertical + long horizontal mid-lines) — use scattered local walls instead.',
      );
    }
    if (requireSegmentVariety && size >= 6 && segLengths.size < MIN_SEGMENT_LENGTH_VARIETY_DAILY) {
      errors.push(
        `Need at least ${MIN_SEGMENT_LENGTH_VARIETY_DAILY} distinct segment lengths (has ${segLengths.size}: [${[...segLengths].sort((a, b) => a - b).join(', ')}]).`,
      );
    }
    if (requireWallDistribution) {
      errors.push(...wallConcentrationErrors(layout));
    }
  } else if (fullCross) {
    warnings.push('Tutorial uses quadrant-style walls — OK for teaching only.');
  }

  return {
    score,
    errors,
    warnings,
    maxVerticalWallColCoverage: vCov,
    maxHorizontalWallRowCoverage: hCov,
    hasFullCross: fullCross,
    distinctSegmentLengths: segLengths.size,
  };
}
