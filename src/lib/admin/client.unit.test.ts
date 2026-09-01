import { describe, expect, it, vi } from 'vitest';

import { AdminApiError, adminFetch } from './client';

describe('adminFetch', () => {
	it('returns data from the standard success envelope', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				headers: new Headers({ 'x-request-id': 'req-1' }),
				json: async () => ({ ok: true, data: { id: '1' } }),
			}),
		);

		await expect(adminFetch<{ id: string }>('/api/admin/example')).resolves.toEqual({ id: '1' });
		vi.unstubAllGlobals();
	});

	it('throws AdminApiError with fields and requestId on failure', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: false,
				status: 400,
				headers: new Headers({ 'x-request-id': 'req-2' }),
				json: async () => ({
					ok: false,
					error: 'Thiếu tiêu đề',
					code: 'VALIDATION',
					fields: { title: 'Bắt buộc' },
				}),
			}),
		);

		const error = await adminFetch('/api/admin/example').catch((caught) => caught);
		expect(error).toBeInstanceOf(AdminApiError);
		expect(error).toMatchObject({
			status: 400,
			code: 'VALIDATION',
			fields: { title: 'Bắt buộc' },
			requestId: 'req-2',
		});
		vi.unstubAllGlobals();
	});

	it('does not set JSON content-type for GET or FormData', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			headers: new Headers(),
			json: async () => ({ ok: true, data: { ok: true } }),
		});
		vi.stubGlobal('fetch', fetchMock);

		await adminFetch('/api/admin/example');
		expect(new Headers(fetchMock.mock.calls[0][1].headers).get('Content-Type')).toBeNull();

		await adminFetch('/api/admin/upload', { method: 'POST', body: new FormData() });
		expect(new Headers(fetchMock.mock.calls[1][1].headers).get('Content-Type')).toBeNull();
		vi.unstubAllGlobals();
	});

	it('returns undefined for HTTP 204', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				status: 204,
				headers: new Headers(),
				json: async () => {
					throw new Error('no body');
				},
			}),
		);
		await expect(adminFetch('/api/admin/example', { method: 'DELETE' })).resolves.toBeUndefined();
		vi.unstubAllGlobals();
	});

	it('reads a success envelope even when the Response mock omits headers and ok', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				json: async () => ({ ok: true, data: { id: '2' } }),
			}),
		);
		await expect(adminFetch<{ id: string }>('/api/admin/example')).resolves.toEqual({ id: '2' });
		vi.unstubAllGlobals();
	});

	it('surfaces envelope errors when the Response mock omits status', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				json: async () => ({ ok: false, error: 'Ô này vừa được người khác chọn.' }),
			}),
		);
		const error = await adminFetch('/api/admin/example').catch((caught) => caught);
		expect(error).toBeInstanceOf(AdminApiError);
		expect(error).toMatchObject({ message: 'Ô này vừa được người khác chọn.', status: 200 });
		vi.unstubAllGlobals();
	});
});
