/**
 * Wall-first layout generator — short local walls, rejection sampling.
 */
import type { DailyPuzzleLayout, PuzzleSolution } from '@/types/puzzle';
import { createEmptyLayout } from '@/lib/puzzle/layoutUtils';
import { compilePuzzle } from '@/lib/puzzle/compiler';
import { findFirstSolution } from '@/lib/puzzle/solver';
import { getSegmentFeasibilityErrors } from '@/lib/puzzle/segmentFeasibility';
import { assessLayoutQuality } from '@/lib/puzzle/layoutQuality';
import { assessBoxiness } from '@/lib/puzzle/layoutBoxiness';
import { pickGivensForUnique } from '@/lib/puzzle/givenPicker';
import { type PuzzleKind } from '@/lib/puzzle/puzzlePolicy';

export type WallProposal =
  | { type: 'vertical'; row: number; col: number }
  | { type: 'horizontal'; row: number; col: number };

export interface GenerateLayoutOptions {
  size: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  puzzleKind?: PuzzleKind;
  seed: string;
  maxAttempts?: number;
  allowBlocked?: boolean;
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function cloneLayout(layout: DailyPuzzleLayout): DailyPuzzleLayout {
  return {
    size: layout.size,
    blocked: layout.blocked.map((r) => [...r]),
    verticalWalls: layout.verticalWalls.map((r) => [...r]),
    horizontalWalls: layout.horizontalWalls.map((r) => [...r]),
    givens: { ...layout.givens },
  };
}

export function applyWallProposal(layout: DailyPuzzleLayout, p: WallProposal): DailyPuzzleLayout {
  const next = cloneLayout(layout);
  if (p.type === 'vertical') {
    next.verticalWalls[p.row][p.col] = true;
  } else {
    next.horizontalWalls[p.row][p.col] = true;
  }
  return next;
}

function wallAlready(layout: DailyPuzzleLayout, p: WallProposal): boolean {
  if (p.type === 'vertical') return layout.verticalWalls[p.row][p.col] === true;
  return layout.horizontalWalls[p.row][p.col] === true;
}

export function proposeRandomWall(
  layout: DailyPuzzleLayout,
  rng: () => number,
): WallProposal | null {
  const size = layout.size;
  const picks: WallProposal[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 1; c < size; c++) {
      if (!layout.verticalWalls[r][c]) picks.push({ type: 'vertical', row: r, col: c });
    }
  }
  for (let r = 1; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!layout.horizontalWalls[r][c]) picks.push({ type: 'horizontal', row: r, col: c });
    }
  }
  if (picks.length === 0) return null;
  return picks[Math.floor(rng() * picks.length)];
}

function targetWallCount(size: number, difficulty: 'EASY' | 'MEDIUM' | 'HARD'): number {
  // Too few walls makes the solver search huge; too many walls tends to dead-end feasibility.
  const base = size <= 5 ? 4 : size <= 6 ? 7 : 12;
  const bump = difficulty === 'EASY' ? 0 : difficulty === 'MEDIUM' ? 1 : 2;
  return Math.min(base + bump, (size - 1) * size);
}

function countInternalWalls(layout: DailyPuzzleLayout): number {
  const size = layout.size;
  let n = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 1; c < size; c++) if (layout.verticalWalls[r][c]) n++;
  }
  for (let r = 1; r < size; r++) {
    for (let c = 0; c < size; c++) if (layout.horizontalWalls[r][c]) n++;
  }
  return n;
}

function passesIncrementalGates(layout: DailyPuzzleLayout, puzzleKind: PuzzleKind): boolean {
  const compiled = compilePuzzle(layout);
  if (getSegmentFeasibilityErrors(compiled).length > 0) return false;
  const box = assessBoxiness(layout, puzzleKind, {
    requireSegmentVariety: false,
    requireWallDistribution: false,
  });
  return box.errors.length === 0;
}

function defaultMaxAttempts(size: number): number {
  return size <= 6 ? 80 : 120;
}

export interface GeneratedPuzzle {
  layout: DailyPuzzleLayout;
  solution: PuzzleSolution;
}

/**
 * Generate a daily-style layout with scattered local walls.
 */
export function generateLocalWallLayout(options: GenerateLayoutOptions): GeneratedPuzzle | null {
  const {
    size,
    difficulty,
    puzzleKind = 'DAILY',
    seed,
    maxAttempts = defaultMaxAttempts(size),
    allowBlocked = false,
  } = options;
  const rng = mulberry32(hashSeed(seed));
  // Keep generation snappy; seed/runtime validation will re-solve with larger budgets if needed.
  const budget = { maxNodes: 150_000, maxMs: 1_500 };
  const wallsTarget = targetWallCount(size, difficulty);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let layout = createEmptyLayout(size);

    if (allowBlocked && size >= 6 && rng() < 0.35) {
      const br = 1 + Math.floor(rng() * (size - 2));
      const bc = 1 + Math.floor(rng() * (size - 2));
      layout.blocked[br][bc] = true;
    }

    let placed = 0;
    let stagnation = 0;
    while (placed < wallsTarget && stagnation < 40) {
      const p = proposeRandomWall(layout, rng);
      if (!p || wallAlready(layout, p)) {
        stagnation++;
        continue;
      }
      const next = applyWallProposal(layout, p);
      if (!passesIncrementalGates(next, puzzleKind)) {
        stagnation++;
        continue;
      }
      layout = next;
      placed++;
      stagnation = 0;
    }

    if (placed < Math.max(4, Math.floor(wallsTarget * 0.6))) continue;

    const preQ = assessLayoutQuality(layout, undefined, { puzzleKind, difficulty });
    if (!preQ.ok) continue;
    const preB = assessBoxiness(layout, puzzleKind);
    if (preB.errors.length > 0) continue;

    const compiled = compilePuzzle(layout);
    const solved = findFirstSolution(compiled, budget);
    if (!solved) continue;

    const solution: PuzzleSolution = {};
    for (const key of compiled.playableKeys) {
      const v = solved[key];
      if (typeof v === 'number') solution[key] = v;
    }

    layout.givens = pickGivensForUnique(layout, solution, { seedKey: `${seed}:givens` });

    const finalQ = assessLayoutQuality(layout, undefined, { puzzleKind, difficulty });
    const finalB = assessBoxiness(layout, puzzleKind);
    if (finalQ.ok && finalB.errors.length === 0) {
      return { layout, solution };
    }
  }

  return null;
}
