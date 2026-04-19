/* ════════════════════════════════════════════════════════════════════════
   wordStatsService.ts — Word Learning Progress (Prisma / PostgreSQL)
   ════════════════════════════════════════════════════════════════════════ */
import { prisma } from '@/lib/prisma';
import type { PracticeResultDTO, WordStatsDTO } from '@/types/vocab';

// ─── Mapper ───────────────────────────────────────────────────────────────────
function toWordStatsDTO(
stat: {
id: string;
wordId: string;
correctCount: number;
wrongCount: number;
streak: number;
isMemorized: boolean;
lastReviewed: Date;
word: { term: string };
},
): WordStatsDTO {
const total = stat.correctCount + stat.wrongCount;
return {
wordId: stat.wordId,
term: stat.word.term,
correctCount: stat.correctCount,
wrongCount: stat.wrongCount,
totalAttempts: total,
accuracy: total > 0 ? Math.round((stat.correctCount / total) * 100) : 0,
streak: stat.streak,
isMemorized: stat.isMemorized,
lastReviewed: stat.lastReviewed.toISOString(),
};
}

/**
 * Record practice results for a batch of words.
 * Uses upsert: creates a new stat record or updates existing.
 * Streak: increments on correct answer, resets to 0 on wrong.
 * isMemorized: true when streak >= 5.
 */
export async function recordPracticeResults(
userId: string,
results: PracticeResultDTO[],
): Promise<void> {
await prisma.$transaction(
results.map((r) =>
prisma.userWordStat.upsert({
where: { userId_wordId: { userId, wordId: r.wordId } },
create: {
userId,
wordId: r.wordId,
correctCount: r.correct ? 1 : 0,
wrongCount: r.correct ? 0 : 1,
streak: r.correct ? 1 : 0,
isMemorized: false,
lastReviewed: new Date(),
},
update: {
correctCount: r.correct ? { increment: 1 } : undefined,
wrongCount: r.correct ? undefined : { increment: 1 },
streak: r.correct ? { increment: 1 } : 0,
isMemorized: r.correct ? undefined : false,
lastReviewed: new Date(),
},
}),
),
);

// Mark words as memorized where streak >= 5 (separate pass to read updated streaks)
await prisma.userWordStat.updateMany({
where: {
userId,
wordId: { in: results.map((r) => r.wordId) },
streak: { gte: 5 },
},
data: { isMemorized: true },
});
}

/**
 * Get all word stats for a user (sorted by lastReviewed desc).
 */
export async function getUserWordStats(userId: string): Promise<WordStatsDTO[]> {
const stats = await prisma.userWordStat.findMany({
where: { userId },
include: { word: { select: { term: true } } },
orderBy: { lastReviewed: 'desc' },
take: 500,
});
return stats.map(toWordStatsDTO);
}

/**
 * Get stats for specific word IDs for a user (returns a Map for O(1) lookup).
 */
export async function getWordStatsForIds(
userId: string,
wordIds: string[],
): Promise<Map<string, WordStatsDTO>> {
const stats = await prisma.userWordStat.findMany({
where: { userId, wordId: { in: wordIds } },
include: { word: { select: { term: true } } },
});
return new Map(stats.map((s) => [s.wordId, toWordStatsDTO(s)]));
}
