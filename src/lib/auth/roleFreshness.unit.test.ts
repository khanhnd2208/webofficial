import type { JWT } from 'next-auth/jwt';
import { describe, expect, it } from 'vitest';

import { ADMIN_ROLE_RECHECK_SECONDS, applyStoredRole, needsRoleRecheck } from './roleFreshness';

const NOW = 1_800_000_000;

function adminToken(overrides: Partial<JWT> = {}): JWT {
	return { sub: 'u1', email: 'teacher@example.com', role: 'admin', ...overrides };
}

describe('needsRoleRecheck', () => {
	it('rechecks an admin token never checked or checked too long ago', () => {
		expect(needsRoleRecheck(adminToken(), NOW)).toBe(true);
		expect(
			needsRoleRecheck(adminToken({ roleCheckedAt: NOW - ADMIN_ROLE_RECHECK_SECONDS }), NOW),
		).toBe(true);
	});

	it('trusts a recently checked admin token and never rechecks students', () => {
		expect(needsRoleRecheck(adminToken({ roleCheckedAt: NOW - 60 }), NOW)).toBe(false);
		expect(needsRoleRecheck(adminToken({ role: 'student' }), NOW)).toBe(false);
	});
});

describe('applyStoredRole', () => {
	it('drops admin from a renewed session after the account is demoted', () => {
		const token = adminToken({ roleCheckedAt: NOW - ADMIN_ROLE_RECHECK_SECONDS });
		expect(needsRoleRecheck(token, NOW)).toBe(true);
		applyStoredRole(token, { status: 'found', role: 'student' }, NOW);
		expect(token.role).toBe('student');
		expect(token.roleCheckedAt).toBe(NOW);
		expect(needsRoleRecheck(token, NOW + ADMIN_ROLE_RECHECK_SECONDS)).toBe(false);
	});

	it('drops admin when the account no longer exists', () => {
		const token = applyStoredRole(adminToken(), { status: 'found', role: undefined }, NOW);
		expect(token.role).toBe('student');
	});

	it('keeps allowlisted and still-promoted admins', () => {
		expect(
			applyStoredRole(
				adminToken({ email: 'khanhnd2208@gmail.com' }),
				{ status: 'found', role: 'student' },
				NOW,
			).role,
		).toBe('admin');
		expect(applyStoredRole(adminToken(), { status: 'found', role: 'admin' }, NOW).role).toBe(
			'admin',
		);
	});

	it('keeps the token unstamped when the lookup fails, so the next request retries', () => {
		const token = applyStoredRole(adminToken(), { status: 'failed' }, NOW);
		expect(token.role).toBe('admin');
		expect(token.roleCheckedAt).toBeUndefined();
	});
});
