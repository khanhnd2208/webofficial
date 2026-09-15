import { afterEach, describe, expect, it, vi } from 'vitest';

import { isAdminAllowlistedEmail, reconciledRole, roleForNewUser } from './roles';

afterEach(() => {
	vi.unstubAllEnvs();
});

describe('roleForNewUser', () => {
	it('grants admin only to the allowlist and fail-closes everyone else', () => {
		expect(roleForNewUser('khanhnd2208@gmail.com')).toBe('admin');
		expect(roleForNewUser('KHANHND2208@GMAIL.COM')).toBe('admin');
		expect(roleForNewUser('khanhndfmt@hanu.edu.vn')).toBe('admin');
		expect(roleForNewUser('KHANHNDFMT@HANU.EDU.VN')).toBe('admin');
		expect(roleForNewUser('student@example.com')).toBe('student');
		expect(roleForNewUser(null)).toBe('student');
	});

	it('includes ADMIN_EMAIL when set', () => {
		vi.stubEnv('ADMIN_EMAIL', 'extra-admin@example.com');
		expect(roleForNewUser('extra-admin@example.com')).toBe('admin');
		expect(isAdminAllowlistedEmail('extra-admin@example.com')).toBe(true);
	});
});

describe('reconciledRole', () => {
	it('upgrades an allowlisted existing account', () => {
		expect(reconciledRole('khanhnd2208@gmail.com', 'student')).toBe('admin');
		expect(reconciledRole('khanhndfmt@hanu.edu.vn', 'student')).toBe('admin');
	});

	it('keeps a manually promoted admin who is not on the allowlist', () => {
		expect(reconciledRole('teacher@example.com', 'admin')).toBe('admin');
	});

	it('never grants admin to an unknown email', () => {
		expect(reconciledRole('teacher@example.com', 'student')).toBe('student');
		expect(reconciledRole('teacher@example.com', 'teacher')).toBe('student');
	});
});
