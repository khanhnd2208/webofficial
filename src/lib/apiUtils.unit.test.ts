import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

import {
	apiSuccess,
	apiError,
	AppError,
	withAuth,
	withAdmin,
	withErrorHandling,
} from '@/lib/apiUtils';
import { createAdminUser, createApiUser } from '@/test/factories/user';

vi.mock('@/lib/apiAuth', () => ({
	getApiUser: vi.fn(),
	isAdmin: vi.fn(),
}));

import { getApiUser } from '@/lib/apiAuth';

const mockedGetApiUser = vi.mocked(getApiUser);

describe('apiSuccess', () => {
	it('returns ok:true with data and default 200 status', async () => {
		const res = apiSuccess({ id: '1' });
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ ok: true, data: { id: '1' } });
	});

	it('supports custom status codes', async () => {
		const res = apiSuccess(null, 201);
		expect(res.status).toBe(201);
	});
});

describe('apiError', () => {
	it('returns ok:false with error message', async () => {
		const res = apiError('Not found', 404);
		expect(res.status).toBe(404);
		expect(await res.json()).toEqual({ ok: false, error: 'Not found' });
	});
});

describe('withErrorHandling', () => {
	it('passes through successful handler response', async () => {
		const GET = withErrorHandling(async () => apiSuccess(['a']));
		const res = await GET(new NextRequest('http://localhost/api/test'));
		expect(await res.json()).toEqual({ ok: true, data: ['a'] });
	});

	it('maps AppError to client-safe response', async () => {
		const GET = withErrorHandling(async () => {
			throw new AppError('Bad input', 422);
		});
		const res = await GET(new NextRequest('http://localhost/api/test'));
		expect(res.status).toBe(422);
		expect(await res.json()).toEqual({ ok: false, error: 'Bad input' });
	});

	it('maps unknown errors to generic 500', async () => {
		const GET = withErrorHandling(async () => {
			throw new Error('secret db failure');
		});
		const res = await GET(new NextRequest('http://localhost/api/test'));
		expect(res.status).toBe(500);
		expect(await res.json()).toEqual({ ok: false, error: 'Internal server error' });
	});
});

describe('withAuth', () => {
	beforeEach(() => {
		mockedGetApiUser.mockReset();
	});

	it('returns 401 when unauthenticated', async () => {
		mockedGetApiUser.mockResolvedValue(null);
		const GET = withAuth(async (_req, user) => apiSuccess(user));
		const res = await GET(new NextRequest('http://localhost/api/test'));
		expect(res.status).toBe(401);
	});

	it('injects authenticated user into handler', async () => {
		const user = createApiUser();
		mockedGetApiUser.mockResolvedValue(user);
		const GET = withAuth(async (_req, u) => apiSuccess(u));
		const res = await GET(new NextRequest('http://localhost/api/test'));
		expect(await res.json()).toEqual({ ok: true, data: user });
	});

	it('catches AppError from authenticated handler', async () => {
		mockedGetApiUser.mockResolvedValue(createApiUser());
		const GET = withAuth(async () => {
			throw new AppError('Forbidden action', 403);
		});
		const res = await GET(new NextRequest('http://localhost/api/test'));
		expect(res.status).toBe(403);
	});
});

describe('withAdmin', () => {
	beforeEach(() => {
		mockedGetApiUser.mockReset();
	});

	it('returns 401 when unauthenticated', async () => {
		mockedGetApiUser.mockResolvedValue(null);
		const GET = withAdmin(async (_req, user) => apiSuccess(user));
		const res = await GET(new NextRequest('http://localhost/api/test'));
		expect(res.status).toBe(401);
	});

	it('returns 403 for non-admin users', async () => {
		mockedGetApiUser.mockResolvedValue(createApiUser({ role: 'student' }));
		const GET = withAdmin(async (_req, user) => apiSuccess(user));
		const res = await GET(new NextRequest('http://localhost/api/test'));
		expect(res.status).toBe(403);
	});

	it('allows admin users through', async () => {
		const admin = createAdminUser();
		mockedGetApiUser.mockResolvedValue(admin);
		const GET = withAdmin(async (_req, user) => apiSuccess(user));
		const res = await GET(new NextRequest('http://localhost/api/test'));
		expect(await res.json()).toEqual({ ok: true, data: admin });
	});
});
