import { describe, expect, it } from 'vitest';

import {
	isQualifyingAttempt,
	isQualifyingCompletion,
	MIN_ATTEMPT_DURATION_MS,
	sessionDurationMs,
} from '../sessionStats';

describe('sessionStats duration gate', () => {
	const base = new Date('2026-08-06T10:00:00.000Z');

	it('counts attempts on first answer regardless of duration', () => {
		const s = {
			createdAt: base,
			engagedAt: base,
			submittedAt: new Date(base.getTime() + 30 * 1000),
		};
		expect(isQualifyingAttempt(s)).toBe(true);
		expect(isQualifyingCompletion(s)).toBe(false);
	});

	it('rejects completions under 5 minutes', () => {
		const s = {
			createdAt: base,
			engagedAt: base,
			submittedAt: new Date(base.getTime() + 4 * 60 * 1000),
		};
		expect(sessionDurationMs(s)).toBe(4 * 60 * 1000);
		expect(isQualifyingCompletion(s)).toBe(false);
	});

	it('accepts completions at exactly 5 minutes', () => {
		const s = {
			createdAt: base,
			engagedAt: base,
			submittedAt: new Date(base.getTime() + MIN_ATTEMPT_DURATION_MS),
		};
		expect(isQualifyingCompletion(s)).toBe(true);
		expect(isQualifyingAttempt(s)).toBe(true);
	});

	it('uses createdAt when engagedAt was backfilled to submittedAt', () => {
		const submittedAt = new Date(base.getTime() + 12 * 60 * 1000);
		const s = {
			createdAt: base,
			engagedAt: submittedAt,
			submittedAt,
		};
		expect(sessionDurationMs(s)).toBe(12 * 60 * 1000);
		expect(isQualifyingCompletion(s)).toBe(true);
	});

	it('counts in-progress attempts after answering one question', () => {
		const engagedAt = new Date(base.getTime() - 60 * 1000);
		const s = {
			createdAt: engagedAt,
			engagedAt,
			submittedAt: null,
		};
		expect(isQualifyingAttempt(s)).toBe(true);
		expect(isQualifyingCompletion(s)).toBe(false);
	});
});
