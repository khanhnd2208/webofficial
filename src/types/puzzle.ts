/**
 * Daily Logic Puzzle — shared types (One-Up spec)
 */

export interface DailyPuzzleLayout {
  size: number;
  blocked: boolean[][];
  verticalWalls: boolean[][];
  horizontalWalls: boolean[][];
  givens: Record<string, number>;
}

export type PuzzleSolution = Record<string, number>;
export type PuzzleNotes = Record<string, number[]>;
export type PuzzleState = Record<string, number | null | undefined>;

export interface DailyPuzzlePublic {
  id: string;
  dateKey: string;
  title: string;
  size: number;
  layout: DailyPuzzleLayout;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

/** Player-facing catalog row (no layout/solution). */
export interface PuzzleCatalogEntry {
  id: string;
  dateKey: string;
  title: string;
  size: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  puzzleKind: 'DAILY' | 'TUTORIAL';
  isToday: boolean;
  attemptStatus: 'IN_PROGRESS' | 'SOLVED' | 'FAILED' | 'ABANDONED' | null;
}

export interface PuzzleCatalogResponse {
  puzzles: PuzzleCatalogEntry[];
  todayDateKey: string;
  featured8x8PuzzleId: string | null;
  diagnostics: {
    missing8x8: boolean;
    expectedPublishedCount: number;
    publishedCount: number;
    validatorVersion: string;
    setupRequired: boolean;
  };
}

export interface PuzzleAttemptPublic {
  id: string;
  status: 'IN_PROGRESS' | 'SOLVED' | 'FAILED' | 'ABANDONED';
  startedAt: string;
  submittedAt: string | null;
  durationMs: number | null;
  mistakes: number;
  progress?: PuzzleSolution;
  notes?: PuzzleNotes;
}

export interface PuzzleStatsPublic {
  currentStreak: number;
  longestStreak: number;
  totalSolved: number;
  lastSolvedDateKey: string | null;
  todaySolved: boolean;
}

export interface LeaderboardEntryPublic {
  rank: number;
  userId: string;
  userName: string;
  durationMs: number;
  mistakes: number;
  submittedAt: string;
}

export interface SubmitResult {
  correct: boolean;
  durationMs?: number;
  mistakes?: number;
  streak?: PuzzleStatsPublic;
  shareText?: string;
  wrongCells?: string[];
  incomplete?: boolean;
  hasConflict?: boolean;
}
