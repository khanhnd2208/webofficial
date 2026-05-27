import type { DailyPuzzleLayout, DailyPuzzlePublic } from '@/types/puzzle';
import type { PuzzleDifficulty } from '@prisma/client';
import { normalizeLayout } from '@/lib/puzzle/layoutUtils';

export function parseLayoutJson(json: unknown): DailyPuzzleLayout {
  return normalizeLayout(json);
}

export function toPublicPuzzle(puzzle: {
  id: string;
  dateKey: string;
  title: string;
  size: number;
  layoutJson: unknown;
  difficulty: PuzzleDifficulty;
}): DailyPuzzlePublic {
  const layout = parseLayoutJson(puzzle.layoutJson);
  return {
    id: puzzle.id,
    dateKey: puzzle.dateKey,
    title: puzzle.title,
    size: puzzle.size,
    layout,
    difficulty: puzzle.difficulty,
  };
}

export function serializePublicLayout(layout: DailyPuzzleLayout): DailyPuzzleLayout {
  return {
    size: layout.size,
    blocked: layout.blocked,
    verticalWalls: layout.verticalWalls,
    horizontalWalls: layout.horizontalWalls,
    givens: layout.givens,
  };
}
