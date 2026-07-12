import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createApiUser } from '@/test/factories/user';
import { invokeRoute, parseJson } from '@/test/helpers/apiRoute';

vi.mock('@/lib/apiAuth', () => ({
	getApiUser: vi.fn(),
	isAdmin: vi.fn(),
}));

vi.mock('@/services/streakService', () => ({
	getStreak: vi.fn(async () => ({
		currentStreak: 3,
		longestStreak: 5,
		lastLoginDate: '2026-03-19',
		recentDays: ['2026-03-19'],
	})),
	recordLogin: vi.fn(async () => ({
		currentStreak: 3,
		longestStreak: 5,
		lastLoginDate: '2026-03-19',
		recentDays: ['2026-03-19'],
	})),
}));

import { getApiUser } from '@/lib/apiAuth';
import { GET, POST } from '@/app/api/streak/route';

const mockedGetApiUser = vi.mocked(getApiUser);

describe('GET /api/streak', () => {
	beforeEach(() => {
		mockedGetApiUser.mockReset();
	});

	it('returns 401 when unauthenticated', async () => {
		mockedGetApiUser.mockResolvedValue(null);
		const res = await invokeRoute(GET, { url: 'http://localhost/api/streak' });
		expect(res.status).toBe(401);
	});

	it('returns streak data for authenticated user', async () => {
		mockedGetApiUser.mockResolvedValue(createApiUser());
		const res = await invokeRoute(GET, { url: 'http://localhost/api/streak' });
		expect(res.status).toBe(200);
		const json = await parseJson<{ ok: boolean; data: { currentStreak: number } }>(res);
		expect(json.ok).toBe(true);
		expect(json.data.currentStreak).toBe(3);
	});
});

describe('POST /api/streak', () => {
	it('records login for authenticated user', async () => {
		mockedGetApiUser.mockResolvedValue(createApiUser());
		const res = await invokeRoute(POST, {
			url: 'http://localhost/api/streak',
			method: 'POST',
		});
		expect(res.status).toBe(200);
		const json = await parseJson<{ ok: boolean; data: { currentStreak: number } }>(res);
		expect(json.ok).toBe(true);
	});
});
