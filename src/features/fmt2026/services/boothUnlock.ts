import 'server-only';

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * The booth laptop unlocks /fmt2026 with a PIN. A correct PIN earns a signed,
 * httpOnly cookie that names the PIN version it was issued for, so changing the
 * PIN locks every booth that used the old one.
 */

export const BOOTH_COOKIE = 'fmt2026_booth';
export const BOOTH_UNLOCK_TTL_MS = 12 * 60 * 60 * 1000;

const SCRYPT_KEY_LENGTH = 32;

export function hashPin(pin: string): string {
	const salt = randomBytes(16).toString('hex');
	const hash = scryptSync(pin, salt, SCRYPT_KEY_LENGTH).toString('hex');
	return `scrypt:${salt}:${hash}`;
}

export function verifyPin(pin: string, stored: string | null): boolean {
	if (!stored) return false;
	const [scheme, salt, hash] = stored.split(':');
	if (scheme !== 'scrypt' || !salt || !hash) return false;
	const expected = Buffer.from(hash, 'hex');
	const actual = scryptSync(pin, salt, expected.length);
	return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function unlockSecret(): string | null {
	return (
		process.env.AUTH_SECRET?.trim() ||
		process.env.NEXTAUTH_SECRET?.trim() ||
		process.env.ADMIN_SECRET?.trim() ||
		null
	);
}

function sign(payload: string, secret: string): string {
	return createHmac('sha256', secret).update(`fmt2026-booth:${payload}`).digest('hex');
}

/** Returns null when the server has no secret to sign with. */
export function issueBoothToken(pinVersion: number, now = Date.now()): string | null {
	const secret = unlockSecret();
	if (!secret) return null;
	const payload = `${pinVersion}.${now + BOOTH_UNLOCK_TTL_MS}`;
	return `${payload}.${sign(payload, secret)}`;
}

export function isBoothTokenValid(
	token: string | undefined,
	pinVersion: number,
	now = Date.now(),
): boolean {
	const secret = unlockSecret();
	if (!token || !secret) return false;
	const [version, expiresAt, signature] = token.split('.');
	if (!version || !expiresAt || !signature) return false;
	if (Number(version) !== pinVersion || Number(expiresAt) <= now) return false;
	const expected = Buffer.from(sign(`${version}.${expiresAt}`, secret), 'hex');
	const actual = Buffer.from(signature, 'hex');
	return expected.length === actual.length && timingSafeEqual(expected, actual);
}
