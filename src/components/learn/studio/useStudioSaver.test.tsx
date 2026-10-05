import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminApiError } from '@/lib/admin/client';

import { retryDelayMs } from './saveErrors';
import { useStudioSaver } from './useStudioSaver';

const { adminFetch } = vi.hoisted(() => ({ adminFetch: vi.fn() }));

vi.mock('@/lib/admin/client', async () => {
	const actual = await vi.importActual<typeof import('@/lib/admin/client')>('@/lib/admin/client');
	return { ...actual, adminFetch };
});

const URL = '/api/admin/learn/sections/section-1';

async function settle(ms: number) {
	await act(async () => {
		await vi.advanceTimersByTimeAsync(ms);
	});
}

describe('retryDelayMs', () => {
	it('follows 2s, 5s, 10s, 20s, 30s and then stays at 30s, plus jitter', () => {
		expect(retryDelayMs(0, () => 0)).toBe(2_000);
		expect(retryDelayMs(1, () => 0)).toBe(5_000);
		expect(retryDelayMs(2, () => 0)).toBe(10_000);
		expect(retryDelayMs(3, () => 0)).toBe(20_000);
		expect(retryDelayMs(4, () => 0)).toBe(30_000);
		expect(retryDelayMs(9, () => 0)).toBe(30_000);
		expect(retryDelayMs(0, () => 0.5)).toBe(2_500);
	});
});

describe('useStudioSaver', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.spyOn(Math, 'random').mockReturnValue(0);
		adminFetch.mockReset();
		adminFetch.mockResolvedValue({ id: 'section-1' });
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('debounces a patch, then reports saved', async () => {
		const { result } = renderHook(() => useStudioSaver());
		act(() => result.current.queue('section:1', URL, { markdown: 'Bản mới' }));
		expect(result.current.status).toBe('pending');
		expect(adminFetch).not.toHaveBeenCalled();

		await settle(900);

		expect(adminFetch).toHaveBeenCalledWith(
			URL,
			expect.objectContaining({
				method: 'PATCH',
				body: JSON.stringify({ markdown: 'Bản mới' }),
			}),
		);
		expect(result.current.status).toBe('saved');
		await act(async () => {
			await expect(result.current.flush()).resolves.toEqual({ ok: true });
		});
	});

	it('retries a network failure with backoff, and immediately when the browser is online again', async () => {
		adminFetch.mockRejectedValue(new TypeError('Failed to fetch'));
		const { result } = renderHook(() => useStudioSaver());
		act(() => result.current.queue('section:1', URL, { markdown: 'Bản mới' }));
		await settle(900);

		expect(result.current.status).toBe('retrying');
		expect(result.current.retryInMs).toBe(2_000);
		await act(async () => {
			await expect(result.current.flush()).resolves.toEqual({ ok: false });
		});

		adminFetch.mockResolvedValue({ id: 'section-1' });
		await act(async () => {
			window.dispatchEvent(new Event('online'));
		});
		expect(adminFetch.mock.calls.length).toBeGreaterThanOrEqual(2);
		expect(result.current.status).toBe('saved');
	});

	it('retries again on the next backoff step when the connection stays down', async () => {
		adminFetch.mockRejectedValue(new TypeError('Failed to fetch'));
		const { result } = renderHook(() => useStudioSaver());
		act(() => result.current.queue('section:1', URL, { markdown: 'Bản mới' }));
		await settle(900);
		expect(result.current.retryInMs).toBe(2_000);

		await settle(2_000);
		expect(adminFetch).toHaveBeenCalledTimes(2);
		expect(result.current.status).toBe('retrying');
		expect(result.current.retryInMs).toBe(5_000);
	});

	it('retries when the tab becomes visible during a backoff', async () => {
		adminFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
		const { result } = renderHook(() => useStudioSaver());
		act(() => result.current.queue('section:1', URL, { markdown: 'Bản mới' }));
		await settle(900);
		expect(result.current.status).toBe('retrying');

		adminFetch.mockResolvedValueOnce({ id: 'section-1' });
		await act(async () => {
			document.dispatchEvent(new Event('visibilitychange'));
		});
		expect(adminFetch).toHaveBeenCalledTimes(2);
		expect(result.current.status).toBe('saved');
	});

	it('holds a rejected field and keeps saving the others', async () => {
		adminFetch.mockRejectedValueOnce(
			new AdminApiError('Nội dung quá dài', {
				status: 400,
				fields: { markdown: 'Nội dung quá dài' },
			}),
		);
		const { result } = renderHook(() => useStudioSaver());
		act(() => result.current.queue('section:1', URL, { markdown: 'x'.repeat(10) }));
		await settle(900);

		expect(result.current.status).toBe('invalid');
		expect(result.current.issues['section:1']?.markdown).toBe('Nội dung quá dài');
		await settle(30_000);
		expect(adminFetch).toHaveBeenCalledTimes(1);

		act(() =>
			result.current.queue('section:1', URL, { markdown: 'x'.repeat(10), summary: 'Tóm tắt' }),
		);
		await settle(900);
		expect(adminFetch).toHaveBeenLastCalledWith(
			URL,
			expect.objectContaining({ body: JSON.stringify({ summary: 'Tóm tắt' }) }),
		);

		act(() => result.current.queue('section:1', URL, { markdown: 'Bản đã rút' }));
		await settle(900);
		expect(adminFetch).toHaveBeenLastCalledWith(
			URL,
			expect.objectContaining({ body: JSON.stringify({ markdown: 'Bản đã rút' }) }),
		);
		expect(result.current.status).toBe('saved');
	});

	it('drops a missing section and stops on auth errors', async () => {
		adminFetch.mockRejectedValueOnce(new AdminApiError('Không tìm thấy mục học', { status: 404 }));
		const dropped = renderHook(() => useStudioSaver());
		act(() => dropped.result.current.queue('section:1', URL, { markdown: 'Bản mới' }));
		await settle(900);
		expect(dropped.result.current.status).toBe('saved');
		await settle(10_000);
		expect(adminFetch).toHaveBeenCalledTimes(1);

		adminFetch.mockRejectedValueOnce(
			new AdminApiError('Phiên đăng nhập đã hết hạn', { status: 401 }),
		);
		const stopped = renderHook(() => useStudioSaver());
		act(() => stopped.result.current.queue('section:1', URL, { markdown: 'Bản mới' }));
		await settle(900);
		expect(stopped.result.current.status).toBe('error');
		expect(stopped.result.current.error).toMatch(/hết hạn/);
		await act(async () => {
			await expect(stopped.result.current.flush()).resolves.toEqual({ ok: false });
		});
		await settle(30_000);
		expect(adminFetch).toHaveBeenCalledTimes(2);
	});

	it('marks a 409 as a conflict and does not retry it', async () => {
		adminFetch.mockRejectedValueOnce(
			new AdminApiError('Mục vừa được sửa ở nơi khác', { status: 409 }),
		);
		const { result } = renderHook(() => useStudioSaver());
		act(() => result.current.queue('section:1', URL, { markdown: 'Bản mới' }));
		await settle(900);
		expect(result.current.status).toBe('conflict');
		await act(async () => {
			await expect(result.current.flush()).resolves.toEqual({ ok: false });
		});
		await settle(30_000);
		expect(adminFetch).toHaveBeenCalledTimes(1);
	});

	it('keeps a conflict when the user types again, until it is released', async () => {
		adminFetch.mockRejectedValueOnce(
			new AdminApiError('Mục vừa được sửa ở nơi khác', { status: 409 }),
		);
		const { result } = renderHook(() => useStudioSaver());
		act(() => result.current.queue('section:1', URL, { markdown: 'Bản mới' }));
		await settle(900);
		act(() => result.current.queue('section:1', URL, { markdown: 'Bản mới hơn' }));
		await settle(900);
		expect(result.current.status).toBe('conflict');
		expect(adminFetch).toHaveBeenCalledTimes(1);

		act(() => result.current.releaseConflict('section:1'));
		await settle(900);
		expect(adminFetch).toHaveBeenCalledTimes(2);
		expect(result.current.status).toBe('saved');
	});

	it('sends the newest base version with every save', async () => {
		let version = '2026-10-05T10:00:00.000Z';
		adminFetch.mockImplementation(async () => {
			version = '2026-10-05T10:01:00.000Z';
			return { id: 'section-1', updatedAt: version };
		});
		const { result } = renderHook(() =>
			useStudioSaver({ baseFor: (key) => (key === 'section:1' ? version : undefined) }),
		);
		act(() => result.current.queue('section:1', URL, { markdown: 'Một' }));
		await settle(900);
		act(() => result.current.queue('section:1', URL, { markdown: 'Hai' }));
		await settle(900);

		const bodies = adminFetch.mock.calls.map(([, init]) => JSON.parse(String(init.body)));
		expect(bodies).toEqual([
			{ markdown: 'Một', baseUpdatedAt: '2026-10-05T10:00:00.000Z' },
			{ markdown: 'Hai', baseUpdatedAt: '2026-10-05T10:01:00.000Z' },
		]);
	});

	it('blocks flush while a client-side field error is open', async () => {
		const { result } = renderHook(() => useStudioSaver());
		act(() =>
			result.current.syncIssues('section:1', ['title'], { title: 'Tên mục không được để trống' }),
		);
		expect(result.current.status).toBe('invalid');
		expect(result.current.issueCount).toBe(1);
		await act(async () => {
			await expect(result.current.flush()).resolves.toEqual({ ok: false });
		});
		expect(adminFetch).not.toHaveBeenCalled();

		act(() => result.current.clearInvalid('section:1', ['title']));
		expect(result.current.status).toBe('saved');
		await act(async () => {
			await expect(result.current.flush()).resolves.toEqual({ ok: true });
		});
	});
});
