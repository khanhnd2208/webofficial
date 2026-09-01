import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/apiAuth', () => ({
	getApiUser: vi.fn(),
}));

vi.mock('@/services/vocabSetService', () => ({
	getStore: vi.fn(),
	addToLibrary: vi.fn(),
	AlreadyOwnedError: class AlreadyOwnedError extends Error {},
	getVocabSetById: vi.fn(),
}));

import { GET } from './route';
import { getApiUser } from '@/lib/apiAuth';
import { getStore } from '@/services/vocabSetService';

describe('GET /api/vocab-sets/store', () => {
	it('lists the store for guests with alreadyOwned false', async () => {
		vi.mocked(getApiUser).mockResolvedValue(null);
		vi.mocked(getStore).mockResolvedValue({
			items: [{ id: 'set-1', alreadyOwned: false } as never],
			total: 1,
			page: 1,
			limit: 20,
			totalPages: 1,
		});

		const response = await GET(new Request('http://localhost/api/vocab-sets/store') as never);
		const body = await response.json();
		expect(getStore).toHaveBeenCalledWith(null, 1, 20);
		expect(response.status).toBe(200);
		expect(body).toMatchObject({ ok: true, data: { items: [{ id: 'set-1', alreadyOwned: false }] } });
	});
});
