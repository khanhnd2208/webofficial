import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

import { useOfflineQueue, loadQueue, saveQueue } from '@/lib/vocab/useOfflineQueue';

const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] ?? null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		clear: () => {
			store = {};
		},
	};
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useOfflineQueue', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.stubGlobal('fetch', vi.fn());
		Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
	});

	it('starts with empty queue', () => {
		const { result } = renderHook(() => useOfflineQueue());
		expect(result.current.queueLength).toBe(0);
		expect(result.current.isOnline).toBe(true);
	});

	it('enqueue adds action to localStorage', () => {
		const { result } = renderHook(() => useOfflineQueue());
		act(() => {
			result.current.enqueue({ type: 'SOFT_DELETE', vocabSetId: 'set-1' });
		});
		expect(loadQueue()).toHaveLength(1);
		expect(result.current.queueLength).toBe(1);
	});

	it('deduplicates SOFT_DELETE on enqueue', () => {
		const { result } = renderHook(() => useOfflineQueue());
		act(() => {
			result.current.enqueue({ type: 'SOFT_DELETE', vocabSetId: 'set-1' });
			result.current.enqueue({ type: 'SOFT_DELETE', vocabSetId: 'set-1' });
		});
		expect(loadQueue()).toHaveLength(1);
	});

	it('flush calls fetch for queued actions when online', async () => {
		const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
		vi.stubGlobal('fetch', fetchMock);

		saveQueue([{ type: 'SOFT_DELETE', vocabSetId: 'set-abc' }]);
		const { result } = renderHook(() => useOfflineQueue());

		await act(async () => {
			await result.current.flush();
		});

		expect(fetchMock).toHaveBeenCalledWith('/api/vocab-sets/set-abc', { method: 'DELETE' });
		expect(loadQueue()).toHaveLength(0);
	});
});

describe('useVocabStore', () => {
	beforeEach(() => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					ok: true,
					data: {
						items: [{ id: 'set-1', title: 'Set 1', alreadyOwned: false }],
						total: 1,
						page: 1,
						limit: 20,
						totalPages: 1,
					},
				}),
			}),
		);
	});

	it('loads store data on mount', async () => {
		const { useVocabStore } = await import('@/lib/vocab/useVocabStore');
		const { result } = renderHook(() => useVocabStore());

		await waitFor(() => {
			expect(result.current.result?.items).toHaveLength(1);
		});
		expect(result.current.isLoading).toBe(false);
	});
});
