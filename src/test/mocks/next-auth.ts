import { vi } from 'vitest';

import type { ApiUser } from '@/lib/apiAuth';
import { createSessionUser } from '@/test/factories/user';

let mockUser: ApiUser | null = null;

export function setMockSessionUser(user: ApiUser | null): void {
	mockUser = user;
}

export function mockNextAuth(): void {
	vi.mock('@/lib/auth', () => ({
		auth: vi.fn(async () => (mockUser ? createSessionUser(mockUser) : null)),
		handlers: { GET: vi.fn(), POST: vi.fn() },
		signIn: vi.fn(),
		signOut: vi.fn(),
	}));
}

export function mockApiAuth(user: ApiUser | null): void {
	vi.mock('@/lib/apiAuth', async (importOriginal) => {
		const actual = await importOriginal<typeof import('@/lib/apiAuth')>();
		return {
			...actual,
			getApiUser: vi.fn(async () => user),
			isAdmin: vi.fn(async () => user?.role === 'admin'),
		};
	});
}
