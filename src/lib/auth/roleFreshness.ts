import type { JWT } from 'next-auth/jwt';

import { reconciledRole } from './roles';

/**
 * Sessions renew for a year, so an admin role in the token is checked against the database
 * at least this often. A demoted admin loses admin access within this window.
 */
export const ADMIN_ROLE_RECHECK_SECONDS = 5 * 60;

/** `found` with the stored role (possibly none), or `failed` when the database could not answer. */
export type StoredRoleLookup = { status: 'found'; role: string | undefined } | { status: 'failed' };

function nowSeconds(): number {
	return Math.floor(Date.now() / 1000);
}

/** Only admin tokens carry privilege worth rechecking; a student promoted later gets it on update. */
export function needsRoleRecheck(token: JWT, now: number = nowSeconds()): boolean {
	if (token.role !== 'admin') return false;
	return (
		typeof token.roleCheckedAt !== 'number' ||
		now - token.roleCheckedAt >= ADMIN_ROLE_RECHECK_SECONDS
	);
}

/**
 * Apply a stored-role lookup to the token. A missing account or role falls back to student
 * (allowlisted emails stay admin). A failed lookup keeps the token as is, unstamped, so the
 * next request asks again.
 */
export function applyStoredRole(
	token: JWT,
	lookup: StoredRoleLookup,
	now: number = nowSeconds(),
): JWT {
	if (lookup.status === 'failed') return token;
	token.role = reconciledRole(token.email, lookup.role);
	token.roleCheckedAt = now;
	return token;
}
