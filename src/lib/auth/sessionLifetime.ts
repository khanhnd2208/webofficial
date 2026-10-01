/**
 * How long a sign-in lasts on a device. Auth.js slides the cookie expiry on every visit, so an
 * absolute limit from the moment of sign-in is kept in the token too: after a week the person
 * signs in with Google again, however often they used the site in between.
 * Edge-safe: no Node-only APIs.
 */
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

type SignInClock = { signedInAt?: number };

function nowSeconds(): number {
	return Math.floor(Date.now() / 1000);
}

/**
 * Stamp the sign-in time and report whether the token is still within the limit. Tokens issued
 * before the limit existed get stamped now, so nobody is signed out the moment it ships.
 */
export function withinSessionLimit(
	token: SignInClock,
	isNewSignIn: boolean,
	now: number = nowSeconds(),
): boolean {
	if (isNewSignIn || typeof token.signedInAt !== 'number') token.signedInAt = now;
	return now - token.signedInAt < SESSION_MAX_AGE_SECONDS;
}
