import 'server-only';

import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';

/** First-party guest identity for My Space Tests personal progress. */
export const MYSPACE_TESTS_GUEST_COOKIE = 'myspace_tests_guest_id';
export const MYSPACE_TESTS_GUEST_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

export function guestCookieOptions() {
	return {
		httpOnly: true,
		sameSite: 'lax' as const,
		path: '/',
		// Development runs over http://localhost; production is always HTTPS.
		secure: process.env.NODE_ENV === 'production',
		maxAge: MYSPACE_TESTS_GUEST_MAX_AGE_SECONDS,
	};
}

export async function readGuestId(): Promise<string | null> {
	const jar = await cookies();
	const value = jar.get(MYSPACE_TESTS_GUEST_COOKIE)?.value?.trim();
	return value || null;
}

/**
 * Ensure a guest UUID cookie exists. Only call from Route Handlers / Server Actions
 * (cookie writes are not allowed in plain Server Components).
 */
export async function ensureGuestId(): Promise<string> {
	const jar = await cookies();
	const existing = jar.get(MYSPACE_TESTS_GUEST_COOKIE)?.value?.trim();
	if (existing) return existing;

	const guestId = randomUUID();
	jar.set(MYSPACE_TESTS_GUEST_COOKIE, guestId, guestCookieOptions());
	return guestId;
}

export async function clearGuestId(): Promise<void> {
	const jar = await cookies();
	jar.set(MYSPACE_TESTS_GUEST_COOKIE, '', {
		...guestCookieOptions(),
		maxAge: 0,
	});
}
