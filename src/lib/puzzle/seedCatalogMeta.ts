/**
 * Expected published catalog from prisma/puzzle-seed-data (buildSeedPuzzles).
 * Keep in sync when adding seed puzzles — seedPuzzles.test asserts 8×8 date keys.
 */
export const PUZZLE_SEED_PUBLISHED_COUNT = 8;

/** dateKeys of seed puzzles with layout.size === 8 */
export const PUZZLE_SEED_8X8_DATE_KEYS = ['2026-05-26'] as const;
