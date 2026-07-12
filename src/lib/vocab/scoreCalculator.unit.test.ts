import { describe, it, expect } from 'vitest';

import {
	calcMCQScore,
	calcFillBlankScore,
	calcMatchingScore,
	calcGuessWhoScore,
	validateMCQPayload,
	validateFillBlankPayload,
	validateMatchingPayload,
	validateGuessWhoPayload,
	MAX_CLOCK_SKEW_MS,
} from '@/lib/vocab/scoreCalculator';

const NOW = 1_700_000_000_000;

describe('calcMCQScore', () => {
	it('returns 0 for empty questions', () => {
		expect(calcMCQScore([])).toBe(0);
	});

	it('returns 0 for incorrect answers', () => {
		expect(
			calcMCQScore([{ startTime: NOW, endTime: NOW + 1000, correct: false }]),
		).toBe(0);
	});

	it('returns max score for instant correct answer', () => {
		expect(
			calcMCQScore([{ startTime: NOW, endTime: NOW, correct: true }]),
		).toBe(3000);
	});

	it('deducts 100 points per second elapsed', () => {
		expect(
			calcMCQScore([{ startTime: NOW, endTime: NOW + 5000, correct: true }]),
		).toBe(2500);
	});

	it('returns 0 when elapsed >= 30 seconds', () => {
		expect(
			calcMCQScore([{ startTime: NOW, endTime: NOW + 30_000, correct: true }]),
		).toBe(0);
	});

	it('averages across multiple questions', () => {
		const score = calcMCQScore([
			{ startTime: NOW, endTime: NOW, correct: true },
			{ startTime: NOW, endTime: NOW + 10_000, correct: true },
		]);
		expect(score).toBe(2500);
	});

	it('rounds to 1 decimal place', () => {
		const score = calcMCQScore([
			{ startTime: NOW, endTime: NOW + 3333, correct: true },
		]);
		expect(String(score).split('.')[1]?.length ?? 0).toBeLessThanOrEqual(1);
	});
});

describe('validateMCQPayload', () => {
	it('rejects empty array', () => {
		expect(validateMCQPayload([], NOW)).toBe('No questions provided');
	});

	it('rejects invalid timestamp types', () => {
		expect(
			validateMCQPayload(
				[{ startTime: 'bad' as unknown as number, endTime: NOW, correct: true }],
				NOW,
			),
		).toBe('Invalid timestamp type');
	});

	it('rejects non-positive timestamps', () => {
		expect(
			validateMCQPayload([{ startTime: 0, endTime: NOW, correct: true }], NOW),
		).toBe('Timestamps must be positive');
	});

	it('rejects startTime >= endTime', () => {
		expect(
			validateMCQPayload([{ startTime: NOW + 1000, endTime: NOW, correct: true }], NOW),
		).toBe('startTime must be before endTime');
	});

	it('rejects clock skew beyond tolerance', () => {
		const staleEnd = NOW - MAX_CLOCK_SKEW_MS - 5000;
		expect(
			validateMCQPayload(
				[{ startTime: staleEnd - 5000, endTime: staleEnd, correct: true }],
				NOW,
			),
		).toBe('Session timestamp too old or in the future');
	});

	it('accepts valid payload within skew window', () => {
		expect(
			validateMCQPayload(
				[{ startTime: NOW - 5000, endTime: NOW - 1000, correct: true }],
				NOW,
			),
		).toBeNull();
	});
});

describe('calcFillBlankScore', () => {
	it('returns 0 for empty words', () => {
		expect(calcFillBlankScore([])).toBe(0);
	});

	it('applies penaltyMs to effective elapsed time', () => {
		const score = calcFillBlankScore([
			{
				startTime: NOW,
				endTime: NOW + 1000,
				penaltyMs: 5000,
				correct: true,
			},
		]);
		expect(score).toBe(2400);
	});

	it('returns 0 when effective elapsed >= 30s', () => {
		expect(
			calcFillBlankScore([
				{
					startTime: NOW,
					endTime: NOW + 25_000,
					penaltyMs: 10_000,
					correct: true,
				},
			]),
		).toBe(0);
	});

	it('returns 0 for incorrect words', () => {
		expect(
			calcFillBlankScore([
				{ startTime: NOW, endTime: NOW, penaltyMs: 0, correct: false },
			]),
		).toBe(0);
	});
});

describe('validateFillBlankPayload', () => {
	it('rejects negative penaltyMs', () => {
		expect(
			validateFillBlankPayload(
				[{ startTime: NOW, endTime: NOW + 1000, penaltyMs: -1, correct: true }],
				NOW,
			),
		).toBe('Invalid penaltyMs');
	});

	it('accepts valid fill-blank payload', () => {
		expect(
			validateFillBlankPayload(
				[{ startTime: NOW, endTime: NOW + 2000, penaltyMs: 0, correct: true }],
				NOW,
			),
		).toBeNull();
	});
});

describe('calcMatchingScore', () => {
	it('returns 10000 for instant completion', () => {
		expect(
			calcMatchingScore({
				sessionStartTime: NOW,
				sessionEndTime: NOW,
				penaltyMs: 0,
			}),
		).toBe(10000);
	});

	it('deducts 100 points per effective second', () => {
		expect(
			calcMatchingScore({
				sessionStartTime: NOW,
				sessionEndTime: NOW + 10_000,
				penaltyMs: 0,
			}),
		).toBe(9000);
	});

	it('includes penaltyMs in effective elapsed', () => {
		expect(
			calcMatchingScore({
				sessionStartTime: NOW,
				sessionEndTime: NOW + 5000,
				penaltyMs: 5000,
			}),
		).toBe(9000);
	});
});

describe('validateMatchingPayload', () => {
	it('rejects invalid penaltyMs', () => {
		expect(
			validateMatchingPayload(
				{ sessionStartTime: NOW, sessionEndTime: NOW + 1000, penaltyMs: -1 },
				NOW,
			),
		).toBe('Invalid penaltyMs');
	});

	it('accepts valid matching session', () => {
		expect(
			validateMatchingPayload(
				{ sessionStartTime: NOW, sessionEndTime: NOW + 5000, penaltyMs: 0 },
				NOW,
			),
		).toBeNull();
	});
});

describe('calcGuessWhoScore', () => {
	it('uses same formula as matching', () => {
		const session = {
			sessionStartTime: NOW,
			sessionEndTime: NOW + 8000,
			penaltyMs: 2000,
		};
		expect(calcGuessWhoScore(session)).toBe(calcMatchingScore(session));
	});
});

describe('validateGuessWhoPayload', () => {
	it('rejects future timestamps beyond skew', () => {
		expect(
			validateGuessWhoPayload(
				{
					sessionStartTime: NOW,
					sessionEndTime: NOW + MAX_CLOCK_SKEW_MS + 5000,
					penaltyMs: 0,
				},
				NOW,
			),
		).toBe('Session timestamp too old or in the future');
	});

	it('accepts valid guess-who session', () => {
		expect(
			validateGuessWhoPayload(
				{ sessionStartTime: NOW, sessionEndTime: NOW + 3000, penaltyMs: 5000 },
				NOW,
			),
		).toBeNull();
	});
});
