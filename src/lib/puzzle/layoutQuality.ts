/**
 * Layout quality: warnings (authoring) + errors (publish/seed gate).
 */
import type { DailyPuzzleLayout } from '@/types/puzzle';
import { compilePuzzle } from '@/lib/puzzle/compiler';
import { getSegmentFeasibilityErrors } from '@/lib/puzzle/segmentFeasibility';
import {
  maxGivenRatioFor,
  maxSegmentLength1RatioFor,
  type PuzzleKind,
} from '@/lib/puzzle/puzzlePolicy';
import { assessBoxiness } from '@/lib/puzzle/layoutBoxiness';

export interface LayoutQualityThresholds {
  maxGivenRatio: number;
  maxSegmentLength1Ratio: number;
  minBreaksForSize6: number;
  minInternalWallsBySize: Partial<Record<number, number>>;
}

export const DEFAULT_QUALITY_THRESHOLDS: LayoutQualityThresholds = {
  maxGivenRatio: 0.52,
  maxSegmentLength1Ratio: 0.42,
  minBreaksForSize6: 2,
  /** Odd sizes (5,7) cannot use a single mid-line split; enforce from 6×6 up. */
  minInternalWallsBySize: {
    6: 4,
    8: 6,
  },
};

export interface LayoutQualityReport {
  /** No blocking errors. */
  ok: boolean;
  errors: string[];
  warnings: string[];
  internalWallCount: number;
  internalVerticalWalls: number;
  internalHorizontalWalls: number;
  blockedCount: number;
  givenCount: number;
  givenRatio: number;
  segmentLengthVariety: number;
  breaks: number;
}

function countInternalWalls(layout: DailyPuzzleLayout): {
  total: number;
  vertical: number;
  horizontal: number;
} {
  const size = layout.size;
  let vertical = 0;
  let horizontal = 0;

  for (let r = 0; r < size; r++) {
    for (let c = 1; c < size; c++) {
      if (layout.verticalWalls[r][c]) vertical++;
    }
  }
  for (let r = 1; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (layout.horizontalWalls[r][c]) horizontal++;
    }
  }

  return { total: vertical + horizontal, vertical, horizontal };
}

export interface LayoutQualityOptions {
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  puzzleKind?: PuzzleKind;
}

export function assessLayoutQuality(
  layout: DailyPuzzleLayout,
  thresholds: LayoutQualityThresholds = DEFAULT_QUALITY_THRESHOLDS,
  options: LayoutQualityOptions = {},
): LayoutQualityReport {
  const puzzleKind = options.puzzleKind ?? 'DAILY';
  const difficulty = options.difficulty ?? 'MEDIUM';
  const maxGiven = maxGivenRatioFor(difficulty, puzzleKind);
  const maxSeg1 = maxSegmentLength1RatioFor(puzzleKind);
  const warnings: string[] = [];
  const errors: string[] = [];
  const compiled = compilePuzzle(layout);
  const size = layout.size;

  const { total: internalWalls, vertical: internalVerticalWalls, horizontal: internalHorizontalWalls } =
    countInternalWalls(layout);

  let blockedCount = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (layout.blocked[r][c]) blockedCount++;
    }
  }

  const givenCount = Object.keys(layout.givens ?? {}).length;
  const playable = compiled.playableKeys.length;
  const givenRatio = playable > 0 ? givenCount / playable : 0;
  const breaks = internalWalls + blockedCount;

  const segLengths = new Set<number>();
  let segLen1 = 0;
  for (const seg of [...compiled.horizontalSegments, ...compiled.verticalSegments]) {
    segLengths.add(seg.length);
    if (seg.length === 1) segLen1++;
  }

  const segLen1Ratio = playable > 0 ? segLen1 / playable : 0;

  // --- P0: segment domain feasibility (before solver) ---
  errors.push(...getSegmentFeasibilityErrors(compiled));

  // --- Warnings (soft) ---
  if (breaks < 2 && size >= 4) {
    warnings.push('Few internal walls/blocked cells — puzzle may feel like plain fill-in.');
  }
  if (internalWalls === 0 && size >= 5) {
    warnings.push('No internal vertical/horizontal walls — weak One-Up identity.');
  }
  if (segLengths.size < 2 && playable > 4) {
    warnings.push('Segment lengths lack variety.');
  }
  if (segLen1Ratio > 0.22 && segLen1Ratio <= maxSeg1) {
    warnings.push('Many length-1 segments — may feel trivial or brittle.');
  }
  if (givenRatio > maxGiven * 0.85 && givenRatio <= maxGiven) {
    warnings.push(`High given ratio (${Math.round(givenRatio * 100)}%) — puzzle may be too easy.`);
  }
  if (givenRatio > 0 && givenRatio < 0.12 && size >= 5) {
    warnings.push(`Low given ratio (${Math.round(givenRatio * 100)}%) — may be very hard for daily.`);
  }

  // --- Errors (publish / seed gate) ---
  if (givenRatio > maxGiven) {
    errors.push(
      `Given ratio ${Math.round(givenRatio * 100)}% exceeds max ${Math.round(maxGiven * 100)}% for ${difficulty}/${puzzleKind}.`,
    );
  }
  if (segLen1Ratio > maxSeg1) {
    errors.push(
      `Too many length-1 segments (${Math.round(segLen1Ratio * 100)}% > ${Math.round(maxSeg1 * 100)}% cap).`,
    );
  }
  if (size >= 6 && breaks < thresholds.minBreaksForSize6) {
    errors.push(
      `Grid ${size}×${size} needs at least ${thresholds.minBreaksForSize6} wall/blocked breaks (has ${breaks}).`,
    );
  }
  if (size >= 5 && internalWalls === 0 && blockedCount === 0) {
    errors.push('No walls or blocked cells — not a valid ThinkGrid layout.');
  }

  const minWalls = thresholds.minInternalWallsBySize[size];
  if (minWalls != null && internalWalls < minWalls) {
    errors.push(
      `Grid ${size}×${size} needs at least ${minWalls} internal walls (has ${internalWalls}).`,
    );
  }

  if (puzzleKind === 'DAILY' && size >= 6 && (internalVerticalWalls === 0 || internalHorizontalWalls === 0)) {
    errors.push(
      `Daily ${size}×${size} must have internal walls in both directions ` +
        `(vertical: ${internalVerticalWalls}, horizontal: ${internalHorizontalWalls}).`,
    );
  }

  if (puzzleKind === 'DAILY' && size >= 5 && internalWalls < 2) {
    errors.push(
      `Daily ${size}×${size} needs at least 2 internal walls (has ${internalWalls}).`,
    );
  }

  if (puzzleKind === 'DAILY' && size >= 5 && internalWalls === 0 && blockedCount > 0) {
    errors.push(
      'Blocked-only daily layout — use internal walls as primary breaks (blocked cells are secondary).',
    );
  }

  const boxiness = assessBoxiness(layout, puzzleKind);
  errors.push(...boxiness.errors);
  warnings.push(...boxiness.warnings);

  if (size === 7 && puzzleKind === 'DAILY' && internalWalls < 5) {
    warnings.push(
      `7×7 daily has only ${internalWalls} internal walls — prefer ≥5 local walls for One-Up feel.`,
    );
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    internalWallCount: internalWalls,
    internalVerticalWalls,
    internalHorizontalWalls,
    blockedCount,
    givenCount,
    givenRatio,
    segmentLengthVariety: segLengths.size,
    breaks,
  };
}

export function layoutQualityGateMessage(report: LayoutQualityReport): string | null {
  if (report.ok) return null;
  return report.errors.join(' ');
}
