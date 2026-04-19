"use client";
/* ════════════════════════════════════════════════════════════════════════
   useVocabStore.ts — Public store page state management
   
   Handles optimistic UI for add-to-library and graceful error handling
   for already-owned sets.
   ════════════════════════════════════════════════════════════════════════ */
import { useCallback, useEffect, useState } from 'react';
import type { StoreSetDTO, StoreListResult } from '@/types/vocab';
import { useOfflineQueue } from './useOfflineQueue';

interface UseVocabStoreOptions {
	initialPage?: number;
	pageSize?: number;
}

export function useVocabStore({ initialPage = 1, pageSize = 20 }: UseVocabStoreOptions = {}) {
	const [page, setPage] = useState(initialPage);
	const [result, setResult] = useState<StoreListResult | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

	const { enqueue, isOnline } = useOfflineQueue();

	const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
		setToast({ message, type });
		setTimeout(() => setToast(null), 3500);
	}, []);

	const fetchPage = useCallback(async (p: number) => {
		setIsLoading(true);
		setError(null);
		try {
			const res = await fetch(`/api/vocab-sets/store?page=${p}&limit=${pageSize}`);
			const json = await res.json() as { ok: boolean; data?: StoreListResult; error?: string };
			if (!json.ok) throw new Error(json.error ?? 'Unknown error');
			setResult(json.data ?? null);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load store');
		} finally {
			setIsLoading(false);
		}
	}, [pageSize]);

	useEffect(() => {
		fetchPage(page);
	}, [page, fetchPage]);

	const addToLibrary = useCallback(
async (set: StoreSetDTO) => {
			// Optimistic UI: mark as owned immediately
			setResult((prev) => {
				if (!prev) return prev;
				return {
					...prev,
					items: prev.items.map((item) =>
						item.id === set.id ? { ...item, alreadyOwned: true } : item,
					),
				};
			});

			if (!isOnline) {
				enqueue({ type: 'ADD_TO_LIBRARY', vocabSetId: set.id });
				showToast('Đã lưu, sẽ đồng bộ khi có mạng', 'info');
				return;
			}

			try {
				const res = await fetch('/api/vocab-sets/store', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ vocabSetId: set.id }),
});
				if (res.status === 409) {
					showToast('Bạn đã sở hữu bộ từ này', 'info');
					return;
				}
				if (!res.ok) throw new Error('Server error');
				showToast('Đã thêm vào thư viện!', 'success');
			} catch {
				// Roll back optimistic update
				setResult((prev) => {
					if (!prev) return prev;
					return {
						...prev,
						items: prev.items.map((item) =>
							item.id === set.id ? { ...item, alreadyOwned: false } : item,
						),
					};
				});
				showToast('Không thể thêm bộ từ. Vui lòng thử lại.', 'error');
			}
		},
		[isOnline, enqueue, showToast],
	);

	return {
		result,
		isLoading,
		error,
		page,
		setPage,
		addToLibrary,
		toast,
		refetch: () => fetchPage(page),
	};
}
