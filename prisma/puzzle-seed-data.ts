/**
 * Seed puzzles — walls/blocked layouts, solver-generated unique solutions
 */
import type { DailyPuzzleLayout, PuzzleSolution } from '../src/types/puzzle';
import { createEmptyLayout } from '../src/lib/puzzle/layoutUtils';
import { compilePuzzle } from '../src/lib/puzzle/compiler';
import { findFirstSolution } from '../src/lib/puzzle/solver';
import { pickGivensForUnique } from '../src/lib/puzzle/givenPicker';
import { solverBudgetForProfile } from '../src/lib/puzzle/puzzlePolicy';
import { generateLocalWallLayout } from '../src/lib/puzzle/generateLayout';

export interface SeedPuzzle {
  dateKey: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  puzzleKind?: 'DAILY' | 'TUTORIAL';
  layout: DailyPuzzleLayout;
  solution: PuzzleSolution;
}

function buildFromLayout(
  dateKey: string,
  title: string,
  difficulty: 'EASY' | 'MEDIUM' | 'HARD',
  layout: DailyPuzzleLayout,
  puzzleKind: 'DAILY' | 'TUTORIAL' = 'DAILY',
): SeedPuzzle {
  layout.givens = {};
  const compiled = compilePuzzle(layout);
  const solved = findFirstSolution(compiled, solverBudgetForProfile('seed'));
  if (!solved) throw new Error(`No solution for ${dateKey}`);

  const solution: PuzzleSolution = {};
  for (const key of compiled.playableKeys) {
    const v = solved[key];
    if (typeof v === 'number') solution[key] = v;
  }

  layout.givens = pickGivensForUnique(layout, solution, { seedKey: dateKey });
  return { dateKey, title, difficulty, puzzleKind, layout, solution };
}

/** 4×4 four 2×2 quadrants */
function day1(): SeedPuzzle {
  const layout = createEmptyLayout(4);
  for (let r = 0; r < 4; r++) layout.verticalWalls[r][2] = true;
  for (let c = 0; c < 4; c++) layout.horizontalWalls[2][c] = true;
  return buildFromLayout('2026-05-19', 'ThinkGrid #1 — Tutorial', 'EASY', layout, 'TUTORIAL');
}

/** 5×5 blocked cell splits row/col segments (solver-verified) */
function day2(): SeedPuzzle {
  const layout = createEmptyLayout(5);
  layout.blocked[1][3] = true;
  return buildFromLayout('2026-05-20', 'ThinkGrid #2', 'EASY', layout, 'TUTORIAL');
}

/** 5×5 center blocked */
function day3(): SeedPuzzle {
  const layout = createEmptyLayout(5);
  layout.blocked[2][2] = true;
  return buildFromLayout('2026-05-21', 'ThinkGrid #3', 'MEDIUM', layout, 'TUTORIAL');
}

/** 6×6 daily — scattered local walls (wall-first generator) */
function day4(): SeedPuzzle {
  const gen = generateLocalWallLayout({
    size: 6,
    difficulty: 'MEDIUM',
    seed: '2026-05-22-local-walls',
    puzzleKind: 'DAILY',
  });
  if (!gen) throw new Error('Failed to generate 6×6 daily layout');
  return {
    dateKey: '2026-05-22',
    title: 'ThinkGrid #4 — 6×6',
    difficulty: 'MEDIUM',
    puzzleKind: 'DAILY',
    layout: gen.layout,
    solution: gen.solution,
  };
}

/** 5×5 corner blocked — short segments */
function day5(): SeedPuzzle {
  const layout = createEmptyLayout(5);
  layout.blocked[0][4] = true;
  layout.blocked[4][0] = true;
  return buildFromLayout('2026-05-23', 'ThinkGrid #5', 'MEDIUM', layout, 'TUTORIAL');
}

/** 5×5 two blocked cells */
function day6(): SeedPuzzle {
  const layout = createEmptyLayout(5);
  layout.blocked[2][2] = true;
  layout.blocked[3][1] = true;
  return buildFromLayout('2026-05-24', 'ThinkGrid #6', 'MEDIUM', layout, 'TUTORIAL');
}

/**
 * 7×7 — blocked cells break full-row Latin grid (odd size: avoid single mid-line wall split).
 */
function day7(): SeedPuzzle {
  const layout = createEmptyLayout(7);
  layout.blocked[3][3] = true;
  layout.blocked[1][5] = true;
  layout.blocked[5][1] = true;
  return buildFromLayout('2026-05-25', 'ThinkGrid #7 — 7×7', 'HARD', layout, 'TUTORIAL');
}

/** 8×8 daily — short local walls (no full mid cross / quadrant template) */
function day8(): SeedPuzzle {
  const gen = generateLocalWallLayout({
    size: 8,
    difficulty: 'HARD',
    seed: '2026-05-26-local-walls',
    puzzleKind: 'DAILY',
    allowBlocked: true,
    maxAttempts: 800,
  });
  if (!gen) throw new Error('Failed to generate 8×8 daily layout');
  return {
    dateKey: '2026-05-26',
    title: 'ThinkGrid #8 — 8×8',
    difficulty: 'HARD',
    puzzleKind: 'DAILY',
    layout: gen.layout,
    solution: gen.solution,
  };
}

export function buildSeedPuzzles(): SeedPuzzle[] {
  return [day1(), day2(), day3(), day4(), day5(), day6(), day7(), day8()];
}

/** Built at seed runtime so invalid layouts fail with a clear dateKey. */
export const SEED_PUZZLES: SeedPuzzle[] = buildSeedPuzzles();
