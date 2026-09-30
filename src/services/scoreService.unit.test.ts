import { describe, it, expect, vi, beforeEach } from 'vitest';

import { computeScoreFromBody, ScoreValidationError } from '@/services/scoreService';
import { createApiUser } from '@/test/factories/user';

vi.mock('@/lib/prisma', () => ({
	prisma: {
		vocabSet: { findUnique: vi.fn() },
		gameScore: { findUnique: vi.fn(), upsert: vi.fn() },
	},
}));

import { prisma } from '@/lib/prisma';
import { submitGameScore } from '@/services/scoreService';

const NOW = 1_700_000_000_000;

describe('computeScoreFromBody', () => {
	it('computes MCQ score from valid payload', () => {
		const score = computeScoreFromBody(
			{
				mode: 'MCQ',
				questions: [{ startTime: NOW, endTime: NOW + 1000, correct: true }],
			},
			NOW,
		);
		expect(score).toBe(2900);
	});

	it('throws ScoreValidationError for invalid MCQ payload', () => {
		expect(() => computeScoreFromBody({ mode: 'MCQ', questions: [] }, NOW)).toThrow(
			ScoreValidationError,
		);
	});

	it('throws for unknown game mode', () => {
		expect(() => computeScoreFromBody({ mode: 'UNKNOWN' as 'MCQ', questions: [] }, NOW)).toThrow(
			'Unknown game mode',
		);
	});
});

describe('submitGameScore', () => {
	beforeEach(() => {
		vi.mocked(prisma.vocabSet.findUnique).mockReset();
		vi.mocked(prisma.gameScore.findUnique).mockReset();
		vi.mocked(prisma.gameScore.upsert).mockReset();
	});

	it('throws when vocab set not found', async () => {
		vi.mocked(prisma.vocabSet.findUnique).mockResolvedValue(null);
		await expect(
			submitGameScore(createApiUser(), 'missing-id', {
				mode: 'MCQ',
				questions: [{ startTime: NOW, endTime: NOW + 1000, correct: true }],
			}),
		).rejects.toThrow('Vocab set not found');
	});

	it('saves new best score', async () => {
		vi.mocked(prisma.vocabSet.findUnique).mockResolvedValue({ id: 'set-1' } as never);
		vi.mocked(prisma.gameScore.findUnique).mockResolvedValue(null);
		vi.mocked(prisma.gameScore.upsert).mockResolvedValue({} as never);

		const result = await submitGameScore(
			createApiUser(),
			'set-1',
			{
				mode: 'MCQ',
				questions: [{ startTime: NOW, endTime: NOW + 1000, correct: true }],
			},
			NOW,
		);

		expect(result.isNewBest).toBe(true);
		expect(result.score).toBe(2900);
		expect(prisma.gameScore.upsert).toHaveBeenCalled();
	});
});
