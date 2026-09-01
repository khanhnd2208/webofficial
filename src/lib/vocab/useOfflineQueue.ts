"use client";
/* ════════════════════════════════════════════════════════════════════════
   useOfflineQueue.ts — Offline-first action queue
   
   Stores pending API actions in localStorage when offline.
   Auto-flushes (with exponential backoff) when connectivity returns.
   
   Usage:
     const { enqueue, isOnline } = useOfflineQueue();
     enqueue({ type: 'SOFT_DELETE', vocabSetId: 'abc' });
   ════════════════════════════════════════════════════════════════════════ */
import { useCallback, useEffect, useRef, useState } from 'react';

export type OfflineAction =
	| { type: 'SOFT_DELETE'; vocabSetId: string }
	| { type: 'ADD_TO_LIBRARY'; vocabSetId: string };

const STORAGE_KEY = 'vocab_offline_queue';
const MAX_RETRIES = 5;

async function executeAction(action: OfflineAction): Promise<void> {
	if (action.type === 'SOFT_DELETE') {
		const res = await fetch(`/api/vocab-sets/${action.vocabSetId}`, { method: 'DELETE' });
		if (!res.ok) throw new Error(`SOFT_DELETE failed: ${res.status}`);
	} else if (action.type === 'ADD_TO_LIBRARY') {
		const res = await fetch('/api/vocab-sets/store', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ vocabSetId: action.vocabSetId }),
		});
		// 409 = already owned — not an error worth retrying
		if (!res.ok && res.status !== 409) {
			if (res.status === 401) return;
			throw new Error(`ADD_TO_LIBRARY failed: ${res.status}`);
		}
	}
}

/** @internal Exported for unit tests */
export function loadQueue(): OfflineAction[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as OfflineAction[]) : [];
	} catch {
		return [];
	}
}

/** @internal Exported for unit tests */
export function saveQueue(queue: OfflineAction[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
	} catch {
		// localStorage full or unavailable
	}
}

export function useOfflineQueue() {
	const [isOnline, setIsOnline] = useState(
		typeof navigator !== 'undefined' ? navigator.onLine : true,
	);
	// Lazy initializer reads localStorage once on mount — avoids setState-in-effect
	const [queueLength, setQueueLength] = useState(() =>
		typeof window !== 'undefined' ? loadQueue().length : 0,
	);
	const retryRef = useRef(0);
	const flushingRef = useRef(false);
	const flushRef = useRef<() => Promise<void>>(async () => {});

	const flush = useCallback(async () => {
		if (flushingRef.current || !navigator.onLine) return;
		flushingRef.current = true;

		const queue = loadQueue();
		const failed: OfflineAction[] = [];

		for (const action of queue) {
			try {
				await executeAction(action);
			} catch {
				failed.push(action);
			}
		}

		saveQueue(failed);
		setQueueLength(failed.length);
		flushingRef.current = false;

		// Exponential backoff if there are still failures
		if (failed.length > 0 && retryRef.current < MAX_RETRIES) {
			const delay = Math.min(1000 * 2 ** retryRef.current, 30_000);
			retryRef.current++;
			setTimeout(() => flushRef.current(), delay);
		} else {
			retryRef.current = 0;
		}
	}, []);

	// Keep flushRef pointing to latest flush (must be in effect, not render)
	useEffect(() => {
		flushRef.current = flush;
	});

	const enqueue = useCallback(
		(action: OfflineAction) => {
			const queue = loadQueue();
			// Deduplicate SOFT_DELETE for same set
			if (action.type === 'SOFT_DELETE') {
				const exists = queue.some(
					(q) => q.type === 'SOFT_DELETE' && q.vocabSetId === action.vocabSetId,
				);
				if (exists) return;
			}
			queue.push(action);
			saveQueue(queue);
			setQueueLength(queue.length);

			if (navigator.onLine) {
				flush();
			}
		},
		[flush],
	);

	useEffect(() => {
		const handleOnline = () => {
			setIsOnline(true);
			retryRef.current = 0;
			flush();
		};
		const handleOffline = () => setIsOnline(false);

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);
		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	}, [flush]);

	return { enqueue, isOnline, queueLength, flush };
}
