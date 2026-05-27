import { prisma } from '@/lib/prisma';
import { getPuzzleDateKey, getPreviousDateKey } from '@/lib/puzzle/dateKey';
import type { PuzzleStatsPublic } from '@/types/puzzle';

export async function getOrCreateStats(userId: string) {
  return prisma.puzzleUserStats.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export async function getPuzzleStatsPublic(userId: string): Promise<PuzzleStatsPublic> {
  const stats = await getOrCreateStats(userId);
  const todayKey = getPuzzleDateKey();
  return {
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    totalSolved: stats.totalSolved,
    lastSolvedDateKey: stats.lastSolvedDateKey,
    todaySolved: stats.lastSolvedDateKey === todayKey,
  };
}

/**
 * Update streak after a valid solve. Idempotent for same dateKey.
 */
export async function updatePuzzleStreak(userId: string, solvedDateKey: string) {
  const stats = await getOrCreateStats(userId);

  if (stats.lastSolvedDateKey === solvedDateKey) {
    return getPuzzleStatsPublic(userId);
  }

  const prevKey = getPreviousDateKey(solvedDateKey);
  let newStreak = 1;
  if (stats.lastSolvedDateKey === prevKey) {
    newStreak = stats.currentStreak + 1;
  }

  const longestStreak = Math.max(stats.longestStreak, newStreak);

  await prisma.puzzleUserStats.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak,
      lastSolvedDateKey: solvedDateKey,
      totalSolved: { increment: 1 },
    },
  });

  return getPuzzleStatsPublic(userId);
}
