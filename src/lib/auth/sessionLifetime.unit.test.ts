import { describe, expect, it } from 'vitest';

import { SESSION_MAX_AGE_SECONDS, withinSessionLimit } from './sessionLifetime';

const NOW = 1_800_000_000;
const DAY = 24 * 60 * 60;

describe('withinSessionLimit', () => {
	it('lasts one week', () => {
		expect(SESSION_MAX_AGE_SECONDS).toBe(7 * DAY);
	});

	it('stamps a fresh sign-in', () => {
		const token: { signedInAt?: number } = { signedInAt: NOW - 30 * DAY };
		expect(withinSessionLimit(token, true, NOW)).toBe(true);
		expect(token.signedInAt).toBe(NOW);
	});

	it('keeps a session within the week, however often it is refreshed', () => {
		expect(withinSessionLimit({ signedInAt: NOW - 6 * DAY }, false, NOW)).toBe(true);
	});

	it('ends a session a week after sign-in', () => {
		expect(withinSessionLimit({ signedInAt: NOW - 7 * DAY }, false, NOW)).toBe(false);
	});

	it('gives tokens from before the limit a fresh week instead of signing them out', () => {
		const token: { signedInAt?: number } = {};
		expect(withinSessionLimit(token, false, NOW)).toBe(true);
		expect(token.signedInAt).toBe(NOW);
	});
});
