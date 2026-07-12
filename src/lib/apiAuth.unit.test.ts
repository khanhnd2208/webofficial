import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

import { getApiUser, isAdmin } from '@/lib/apiAuth';
import { createAdminUser, createApiUser } from '@/test/factories/user';

vi.mock('@/lib/auth', () => ({
	auth: vi.fn(),
}));

import { auth } from '@/lib/auth';

// Auth.js exposes an overloaded callable whose public type also includes the
// middleware signature. The unit test replaces it with a zero-argument mock.
const mockedAuth = auth as unknown as ReturnType<typeof vi.fn>;

describe('apiAuth', () => {
	beforeEach(() => {
		mockedAuth.mockReset();
	});

	it('getApiUser returns null when no session', async () => {
		mockedAuth.mockResolvedValue(null);
		const user = await getApiUser(new NextRequest('http://localhost/api/test'));
		expect(user).toBeNull();
	});

	it('getApiUser maps session to ApiUser', async () => {
		const apiUser = createApiUser();
		mockedAuth.mockResolvedValue({
			user: {
				id: apiUser.id,
				email: apiUser.email,
				name: apiUser.name,
				role: apiUser.role,
			},
			expires: new Date().toISOString(),
		});
		const user = await getApiUser(new NextRequest('http://localhost/api/test'));
		expect(user).toEqual(apiUser);
	});

	it('isAdmin returns true for admin role', async () => {
		mockedAuth.mockResolvedValue({
			user: createAdminUser(),
			expires: new Date().toISOString(),
		});
		expect(await isAdmin(new NextRequest('http://localhost/api/test'))).toBe(true);
	});

	it('isAdmin returns false for student role', async () => {
		mockedAuth.mockResolvedValue({
			user: createApiUser({ role: 'student' }),
			expires: new Date().toISOString(),
		});
		expect(await isAdmin(new NextRequest('http://localhost/api/test'))).toBe(false);
	});
});
