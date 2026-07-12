import { prisma } from '@/lib/prisma';
import {
	calcMCQScore,
	calcFillBlankScore,
	calcMatchingScore,
	calcGuessWhoScore,
	validateMCQPayload,
	validateFillBlankPayload,
	validateMatchingPayload,
	validateGuessWhoPayload,
	type MCQQuestion,
	type FillBlankWord,
	type MatchingSession,
	type GuessWhoSession,
} from '@/lib/vocab/scoreCalculator';
import type { ApiUser } from '@/lib/apiAuth';

export type ScoreBody =
	| { mode: 'MCQ'; questions: MCQQuestion[] }
	| { mode: 'FILL_BLANK'; words: FillBlankWord[] }
	| { mode: 'MATCHING'; sessionStartTime: number; sessionEndTime: number; penaltyMs: number }
	| { mode: 'GUESS_WHO'; sessionStartTime: number; sessionEndTime: number; penaltyMs: number };

export type SubmitScoreResult = {
	score: number;
	isNewBest: boolean;
	previousBest: number | null;
	savedScore: number | null;
};

export class ScoreValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ScoreValidationError';
	}
}

export function computeScoreFromBody(body: ScoreBody, nowMs = Date.now()): number {
	if (body.mode === 'MCQ') {
		const err = validateMCQPayload(body.questions, nowMs);
		if (err) throw new ScoreValidationError(err);
		return calcMCQScore(body.questions);
	}
	if (body.mode === 'FILL_BLANK') {
		const err = validateFillBlankPayload(body.words, nowMs);
		if (err) throw new ScoreValidationError(err);
		return calcFillBlankScore(body.words);
	}
	if (body.mode === 'MATCHING') {
		const session: MatchingSession = {
			sessionStartTime: body.sessionStartTime,
			sessionEndTime: body.sessionEndTime,
			penaltyMs: body.penaltyMs,
		};
		const err = validateMatchingPayload(session, nowMs);
		if (err) throw new ScoreValidationError(err);
		return calcMatchingScore(session);
	}
	if (body.mode === 'GUESS_WHO') {
		const session: GuessWhoSession = {
			sessionStartTime: body.sessionStartTime,
			sessionEndTime: body.sessionEndTime,
			penaltyMs: body.penaltyMs,
		};
		const err = validateGuessWhoPayload(session, nowMs);
		if (err) throw new ScoreValidationError(err);
		return calcGuessWhoScore(session);
	}
	throw new ScoreValidationError('Unknown game mode');
}

export async function submitGameScore(
	user: ApiUser,
	vocabSetId: string,
	body: ScoreBody,
	nowMs = Date.now(),
): Promise<SubmitScoreResult> {
	const set = await prisma.vocabSet.findUnique({
		where: { id: vocabSetId },
		select: { id: true },
	});
	if (!set) {
		throw new ScoreValidationError('Vocab set not found');
	}

	const score = computeScoreFromBody(body, nowMs);
	const mode = body.mode;

	const existing = await prisma.gameScore.findUnique({
		where: { userId_vocabSetId_mode: { userId: user.id, vocabSetId, mode } },
	});

	const isNewBest = !existing || score > existing.score;
	let savedScore = existing?.score ?? null;

	if (isNewBest) {
		const userName = user.name ?? user.email ?? 'Unknown';
		await prisma.gameScore.upsert({
			where: { userId_vocabSetId_mode: { userId: user.id, vocabSetId, mode } },
			create: { userId: user.id, userName, vocabSetId, mode, score },
			update: { score, userName },
		});
		savedScore = score;
	}

	return {
		score,
		isNewBest,
		previousBest: existing?.score ?? null,
		savedScore,
	};
}
