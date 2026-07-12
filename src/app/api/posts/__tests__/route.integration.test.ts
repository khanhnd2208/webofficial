import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createApiUser } from '@/test/factories/user';
import { invokeRoute, parseJson } from '@/test/helpers/apiRoute';

vi.mock('@/lib/apiAuth', () => ({
	getApiUser: vi.fn(),
	isAdmin: vi.fn(),
}));

vi.mock('@/services/postService', () => ({
	getAllPosts: vi.fn(async () => ({
		items: [{ id: '1', title: 'Post A', slug: 'post-a' }],
		total: 1,
		page: 1,
		limit: 10,
		totalPages: 1,
	})),
}));

import { GET } from '@/app/api/posts/route';

describe('GET /api/posts', () => {
	it('returns public post list', async () => {
		const res = await invokeRoute(GET, { url: 'http://localhost/api/posts' });
		expect(res.status).toBe(200);
		const json = await parseJson<{ ok: boolean; data: { items: unknown[] } }>(res);
		expect(json.ok).toBe(true);
		expect(json.data.items).toHaveLength(1);
	});
});

describe('POST /api/posts', () => {
	beforeEach(async () => {
		const { getApiUser } = await import('@/lib/apiAuth');
		vi.mocked(getApiUser).mockReset();
	});

	it('returns 401 for unauthenticated create', async () => {
		const { getApiUser } = await import('@/lib/apiAuth');
		vi.mocked(getApiUser).mockResolvedValue(null);
		const { POST } = await import('@/app/api/posts/route');
		const res = await invokeRoute(POST, {
			method: 'POST',
			url: 'http://localhost/api/posts',
			body: { title: 'New' },
		});
		expect(res.status).toBe(401);
	});

	it('returns 403 for non-admin create', async () => {
		const { getApiUser } = await import('@/lib/apiAuth');
		vi.mocked(getApiUser).mockResolvedValue(createApiUser({ role: 'student' }));
		const { POST } = await import('@/app/api/posts/route');
		const res = await invokeRoute(POST, {
			method: 'POST',
			url: 'http://localhost/api/posts',
			body: { title: 'New' },
		});
		expect(res.status).toBe(403);
	});
});
