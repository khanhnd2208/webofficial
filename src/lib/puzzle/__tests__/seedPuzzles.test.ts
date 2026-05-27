import { describe, it, expect } from 'vitest';
import { buildSeedPuzzles } from '../../../../prisma/puzzle-seed-data';
import { compilePuzzle } from '@/lib/puzzle/compiler';
import { validateFullSolution } from '@/lib/puzzle/validator';
import { hasUniqueSolution } from '@/lib/puzzle/solver';
import { validatePuzzleForPublish } from '@/lib/puzzle/puzzleValidation';
import { assessLayoutQuality } from '@/lib/puzzle/layoutQuality';
import { detectFullCross } from '@/lib/puzzle/layoutBoxiness';
import { hasVerticalWallBetween } from '@/lib/puzzle/layoutUtils';
import { buildHorizontalSegments } from '@/lib/puzzle/segments';
import { PUZZLE_SEED_8X8_DATE_KEYS, PUZZLE_SEED_PUBLISHED_COUNT } from '@/lib/puzzle/seedCatalogMeta';

/** Built once — day4/day8 generator is slow; avoid calling buildSeedPuzzles() per test file. */
const puzzles = buildSeedPuzzles();

describe('seed puzzles', () => {

  it('builds 8 puzzles without throw', () => {
    expect(puzzles).toHaveLength(PUZZLE_SEED_PUBLISHED_COUNT);
    for (const p of puzzles) {
      expect(p.solution).toBeDefined();
      expect(Object.keys(p.solution).length).toBeGreaterThan(0);
    }
  });

  it.each(puzzles.map((p) => [p.dateKey, p] as const))(
    '%s has valid solution and unique givens',
    (dateKey, puzzle) => {
      const compiled = compilePuzzle(puzzle.layout);
      expect(validateFullSolution(puzzle.solution, puzzle.layout)).toBeNull();
      expect(hasUniqueSolution(compiled)).toBe(true);

      const kind = puzzle.puzzleKind ?? 'DAILY';
      const publish = validatePuzzleForPublish(puzzle.layout, puzzle.solution, {
        difficulty: puzzle.difficulty,
        puzzleKind: kind,
        solverProfile: 'seed',
      });
      expect(publish.ok, publish.errors.join('; ')).toBe(true);
      expect(assessLayoutQuality(puzzle.layout, undefined, {
        difficulty: puzzle.difficulty,
        puzzleKind: kind,
      }).ok).toBe(true);
      expect(publish.difficultyScore).toBeGreaterThanOrEqual(0);
    },
  );

  it('day7 is 7x7 with center blocked (harder than 4x4 quadrants)', () => {
    const day7 = puzzles.find((p) => p.dateKey === '2026-05-25')!;
    expect(day7.layout.size).toBe(7);
    expect(day7.layout.blocked[3][3]).toBe(true);
    expect(day7.difficulty).toBe('HARD');
  });

  it('seedCatalogMeta 8x8 date keys match seed file', () => {
    const seed8Keys = puzzles.filter((p) => p.layout.size === 8).map((p) => p.dateKey);
    expect(seed8Keys).toEqual([...PUZZLE_SEED_8X8_DATE_KEYS]);
  });

  it('day4 and day8 daily layouts avoid quadrant full cross', () => {
    for (const key of ['2026-05-22', '2026-05-26'] as const) {
      const p = puzzles.find((x) => x.dateKey === key)!;
      expect(p.puzzleKind ?? 'DAILY').toBe('DAILY');
      expect(detectFullCross(p.layout)).toBe(false);
    }
    const day8 = puzzles.find((p) => p.dateKey === '2026-05-26')!;
    expect(day8.layout.size).toBe(8);
    expect(day8.difficulty).toBe('HARD');
    expect(Object.keys(day8.solution).length).toBeGreaterThan(50);
  });
});

describe('wall alignment with compiler', () => {
  it('verticalWalls[r][2] splits horizontal segment between col 1 and 2', () => {
    const day1 = puzzles.find((p) => p.dateKey === '2026-05-19')!;
    const layout = day1.layout;
    expect(hasVerticalWallBetween(layout, 0, 1, 2)).toBe(true);
    const { segments } = buildHorizontalSegments(layout);
    const row0 = segments.filter((s) => s.cells[0]?.row === 0);
    expect(row0).toHaveLength(2);
    expect(row0[0].length).toBe(2);
    expect(row0[1].length).toBe(2);
  });
});
