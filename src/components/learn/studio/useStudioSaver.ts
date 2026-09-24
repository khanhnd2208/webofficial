'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { adminFetch } from '@/lib/admin/client';

export type SaveStatus = 'saved' | 'pending' | 'saving' | 'error';

interface PendingPatch {
	url: string;
	body: Record<string, unknown>;
}

const DEBOUNCE_MS = 900;

/**
 * Debounced PATCH queue keyed by entity. Edits to the same entity merge into one request;
 * a failed request is re-queued underneath any newer edits so nothing typed is lost.
 */
export function useStudioSaver() {
	const pending = useRef(new Map<string, PendingPatch>());
	const inflight = useRef<Promise<void> | null>(null);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [status, setStatus] = useState<SaveStatus>('saved');
	const [error, setError] = useState<string | null>(null);

	const flush = useCallback(async (): Promise<void> => {
		if (timer.current) {
			clearTimeout(timer.current);
			timer.current = null;
		}
		if (inflight.current) await inflight.current;
		if (!pending.current.size) return;

		const batch = [...pending.current.entries()];
		pending.current.clear();
		setStatus('saving');

		let failure: string | null = null;
		const run = (async () => {
			for (const [key, item] of batch) {
				try {
					await adminFetch(item.url, { method: 'PATCH', body: JSON.stringify(item.body) });
				} catch (err) {
					failure = err instanceof Error ? err.message : 'Không lưu được';
					const newer = pending.current.get(key);
					pending.current.set(key, { url: item.url, body: { ...item.body, ...(newer?.body ?? {}) } });
				}
			}
		})();
		inflight.current = run;
		await run;
		inflight.current = null;

		setError(failure);
		setStatus(failure ? 'error' : pending.current.size ? 'pending' : 'saved');
	}, []);

	const queue = useCallback(
		(key: string, url: string, patch: Record<string, unknown>) => {
			const current = pending.current.get(key);
			pending.current.set(key, { url, body: { ...(current?.body ?? {}), ...patch } });
			setStatus('pending');
			if (timer.current) clearTimeout(timer.current);
			timer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
		},
		[flush],
	);

	useEffect(() => {
		const warn = (event: BeforeUnloadEvent) => {
			if (pending.current.size || inflight.current) event.preventDefault();
		};
		window.addEventListener('beforeunload', warn);
		return () => window.removeEventListener('beforeunload', warn);
	}, []);

	return { status, error, queue, flush };
}
