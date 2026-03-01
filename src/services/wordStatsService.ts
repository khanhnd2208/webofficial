import mongoose from 'mongoose';

import dbConnect from '@/lib/dbConnect';
import WordStats from '@/models/WordStats';
import type { PracticeResultDTO, WordStatsDTO } from '@/types/wordStats';

/** Shared DTO mapper for word stats documents */
function toWordStatsDTO(doc: { word: string; correctCount: number; wrongCount: number; lastPracticed: Date }): WordStatsDTO {
	const total = doc.correctCount + doc.wrongCount;
	return {
		word: doc.word,
		correctCount: doc.correctCount,
		wrongCount: doc.wrongCount,
		totalAttempts: total,
		accuracy: total > 0 ? Math.round((doc.correctCount / total) * 100) : 0,
		lastPracticed: new Date(doc.lastPracticed).toISOString(),
	};
}

/**
 * Record practice results for multiple words in one batch.
 * Uses bulkWrite with upsert for efficiency.
 */
export async function recordPracticeResults(
	userId: string,
	results: PracticeResultDTO[]
): Promise<void> {
	await dbConnect();
	if (!mongoose.isValidObjectId(userId) || results.length === 0) return;

	const oid = new mongoose.Types.ObjectId(userId);
	const now = new Date();

	const ops = results.map((r) => ({
		updateOne: {
			filter: { userId: oid, word: r.word.toLowerCase().trim() },
			update: {
				$inc: {
					correctCount: r.correct ? 1 : 0,
					wrongCount: r.correct ? 0 : 1,
				},
				$set: { lastPracticed: now },
				$push: {
					history: {
						$each: [{ mode: r.mode, correct: r.correct, timestamp: now }],
						$slice: -50, // keep last 50 entries per word
					},
				},
			},
			upsert: true,
		},
	}));

	await WordStats.bulkWrite(ops);
}

/**
 * Get stats for all words of a specific user.
 */
export async function getUserWordStats(userId: string): Promise<WordStatsDTO[]> {
	await dbConnect();
	if (!mongoose.isValidObjectId(userId)) return [];

	const docs = await WordStats.find({ userId: new mongoose.Types.ObjectId(userId) })
		.sort({ lastPracticed: -1 })
		.limit(500)
		.lean();

	return docs.map(toWordStatsDTO);
}

/**
 * Get stats for a specific list of words (for a vocab set detail view).
 */
export async function getWordStatsForWords(
	userId: string,
	words: string[]
): Promise<Map<string, WordStatsDTO>> {
	await dbConnect();
	if (!mongoose.isValidObjectId(userId) || words.length === 0)
		return new Map();

	const normalised = words.map((w) => w.toLowerCase().trim());
	const docs = await WordStats.find({
		userId: new mongoose.Types.ObjectId(userId),
		word: { $in: normalised },
	}).lean();

	const map = new Map<string, WordStatsDTO>();
	docs.forEach((doc) => {
		map.set(doc.word, toWordStatsDTO(doc));
	});
	return map;
}
