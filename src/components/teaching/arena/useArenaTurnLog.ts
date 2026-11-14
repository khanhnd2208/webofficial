'use client';

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

import { AdminApiError, teachingApi } from '@/components/teaching/admin/api';
import type { RecallArenaTurnRecord } from '@/features/teaching/types';

import type { ArenaProgress } from './arenaGame';
import { arenaTurnsUrl, turnPayload } from './arenaTurnLog';

/**
 * Sends every call of this browser's phiên to the course's arena log on the
 * server, once each, in order, retried on demand. The phiên itself lives in
 * this browser: the server log is a record of past calls, never pulled back
 * into a running phiên.
 */
export function useArenaTurnLog({
	courseId,
	progress,
	setProgress,
	ready,
}: {
	courseId: string;
	progress: ArenaProgress;
	setProgress: Dispatch<SetStateAction<ArenaProgress>>;
	/** False until this browser's own progress is read. */
	ready: boolean;
}) {
	const [failed, setFailed] = useState(false);
	const [round, setRound] = useState(0);
	const sending = useRef(false);
	/** Turns the server refused (for example a student since removed): never resent. */
	const [rejected, setRejected] = useState<ReadonlySet<string>>(() => new Set());
	const pending = progress.history.filter(
		(entry) => !entry.synced && !rejected.has(entry.id),
	).length;

	useEffect(() => {
		if (!ready || failed || sending.current) return;
		const next = progress.history.find((entry) => !entry.synced && !rejected.has(entry.id));
		if (!next) return;
		sending.current = true;
		teachingApi<RecallArenaTurnRecord>(arenaTurnsUrl(courseId), {
			method: 'POST',
			body: JSON.stringify(turnPayload(next)),
		})
			.then(() => {
				setProgress((previous) => ({
					...previous,
					history: previous.history.map((entry) =>
						entry.id === next.id && entry.cpAfter === next.cpAfter
							? { ...entry, synced: true }
							: entry,
					),
				}));
			})
			.catch((error: unknown) => {
				const refused = error instanceof AdminApiError && error.status >= 400 && error.status < 500;
				if (refused && error.status !== 401 && error.status !== 403 && error.status !== 429) {
					setRejected((previous) => new Set([...previous, next.id]));
				} else {
					setFailed(true);
				}
			})
			.finally(() => {
				sending.current = false;
				setRound((value) => value + 1);
			});
	}, [ready, failed, round, rejected, progress.history, courseId, setProgress]);

	// Closing the tab with calls still unsent would leave them only on this machine.
	useEffect(() => {
		if (!pending) return;
		const warn = (event: BeforeUnloadEvent) => event.preventDefault();
		window.addEventListener('beforeunload', warn);
		return () => window.removeEventListener('beforeunload', warn);
	}, [pending]);

	return {
		/** Calls this browser has not saved to the server yet. */
		pending,
		failed: failed && pending > 0,
		/** Calls the server would not take, so they stay only on this machine. */
		rejected: rejected.size,
		retry: () => setFailed(false),
	};
}
