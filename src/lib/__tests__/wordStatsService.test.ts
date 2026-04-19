/* ════════════════════════════════════════════════════════════════════════
   wordStatsService.test.ts
   ════════════════════════════════════════════════════════════════════════ */
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { recordPracticeResults, getUserWordStats, getWordStatsForIds } from '@/services/wordStatsService';

const connectionString = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:5432/teaching_platform_vocab';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const testPrisma = new PrismaClient({ adapter });
const USER_ID = 'stats-test-user-001';
const ADMIN_ID = 'stats-test-admin-001';

let wordId1: string;
let wordId2: string;

async function setup() {
	// Create a VocabSet + Words
	const set = await testPrisma.vocabSet.create({
		data: {
			title: 'Stats Test Set',
			description: '',
			ownerId: ADMIN_ID,
			ownerName: 'Stats Admin',
			words: {
				create: [
					{ term: 'apple', definition: 'a fruit' },
					{ term: 'banana', definition: 'another fruit' },
				],
			},
		},
		include: { words: true },
	});
	wordId1 = set.words[0].id;
	wordId2 = set.words[1].id;
}

async function cleanup() {
	await testPrisma.userWordStat.deleteMany({ where: { userId: USER_ID } });
	await testPrisma.word.deleteMany({ where: { vocabSet: { ownerId: ADMIN_ID } } });
	await testPrisma.vocabSet.deleteMany({ where: { ownerId: ADMIN_ID } });
}

beforeEach(async () => {
	await cleanup();
	await setup();
});

afterAll(async () => {
	await cleanup();
	await testPrisma.$disconnect();
});

describe('recordPracticeResults', () => {
	it('creates new stat record on first practice', async () => {
		await recordPracticeResults(USER_ID, [{ wordId: wordId1, correct: true, mode: 'flashcards' }]);
		const stats = await getUserWordStats(USER_ID);
		expect(stats.length).toBe(1);
		expect(stats[0].correctCount).toBe(1);
		expect(stats[0].wrongCount).toBe(0);
		expect(stats[0].streak).toBe(1);
	});

	it('increments correctCount and streak on correct answer', async () => {
		await recordPracticeResults(USER_ID, [{ wordId: wordId1, correct: true, mode: 'mcq' }]);
		await recordPracticeResults(USER_ID, [{ wordId: wordId1, correct: true, mode: 'mcq' }]);
		const stats = await getUserWordStats(USER_ID);
		expect(stats[0].correctCount).toBe(2);
		expect(stats[0].streak).toBe(2);
	});

	it('increments wrongCount and resets streak on wrong answer', async () => {
		await recordPracticeResults(USER_ID, [{ wordId: wordId1, correct: true, mode: 'flashcards' }]);
		await recordPracticeResults(USER_ID, [{ wordId: wordId1, correct: true, mode: 'flashcards' }]);
		await recordPracticeResults(USER_ID, [{ wordId: wordId1, correct: false, mode: 'flashcards' }]);
		const stats = await getUserWordStats(USER_ID);
		expect(stats[0].wrongCount).toBe(1);
		expect(stats[0].streak).toBe(0);
		expect(stats[0].isMemorized).toBe(false);
	});

	it('marks word as memorized when streak >= 5', async () => {
const results = Array.from({ length: 5 }, () => ({
wordId: wordId1,
correct: true,
mode: 'flashcards' as const,
}));
// Record all 5 correct answers
for (const r of results) {
await recordPracticeResults(USER_ID, [r]);
}
const stats = await getUserWordStats(USER_ID);
expect(stats[0].streak).toBe(5);
expect(stats[0].isMemorized).toBe(true);
});

it('calculates accuracy correctly', async () => {
await recordPracticeResults(USER_ID, [{ wordId: wordId1, correct: true, mode: 'mcq' }]);
await recordPracticeResults(USER_ID, [{ wordId: wordId1, correct: true, mode: 'mcq' }]);
await recordPracticeResults(USER_ID, [{ wordId: wordId1, correct: false, mode: 'mcq' }]);
const stats = await getUserWordStats(USER_ID);
// 2 correct / 3 total = 67%
expect(stats[0].accuracy).toBe(67);
expect(stats[0].totalAttempts).toBe(3);
});

it('handles batch results (multiple words at once)', async () => {
await recordPracticeResults(USER_ID, [
{ wordId: wordId1, correct: true, mode: 'matching' },
{ wordId: wordId2, correct: false, mode: 'matching' },
]);
const stats = await getUserWordStats(USER_ID);
expect(stats.length).toBe(2);
});
});

describe('getWordStatsForIds', () => {
it('returns a Map keyed by wordId', async () => {
await recordPracticeResults(USER_ID, [
{ wordId: wordId1, correct: true, mode: 'flashcards' },
{ wordId: wordId2, correct: false, mode: 'flashcards' },
]);
const map = await getWordStatsForIds(USER_ID, [wordId1, wordId2]);
expect(map.size).toBe(2);
expect(map.get(wordId1)?.correctCount).toBe(1);
expect(map.get(wordId2)?.wrongCount).toBe(1);
});
});
