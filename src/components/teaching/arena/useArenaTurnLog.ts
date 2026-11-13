'use client';

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

import { AdminApiError, teachingApi } from '@/components/teaching/admin/api';
import type { RecallArenaTurnRecord } from '@/features/teaching/types';

import type { ArenaProgress } from './arenaGame';
import { arenaTurnsUrl, entryFromTurn, turnPayload, type RecallArenaTurnDay } from './arenaTurnLog';

/**
 * Keeps the course's arena log on the server in step with this browser:
 * every call is sent once (in order, retried on demand), and the browser
 * also picks up turns saved by other machines.
 */
export function useArenaTurnLog({
	courseId,
	todayIso,
	progress,
	setProgress,
	ready,
}: {
	courseId: string;
	todayIso: string;
	progress: ArenaProgress;
	setProgress: Dispatch<SetStateAction<ArenaProgress>>;
	/** False until this browser's own progress is read. */
	ready: boolean;
}) {
	const [loadedDay, setLoadedDay] = useState<string | null>(null);
	const dayKey = `${courseId}:${todayIso}`;
	const [failed, setFailed] = useState(false);
	const [round, setRound] = useState(0);
	const sending = useRef(false);
	/** Turns the server refused (for example a student since removed): never resent. */
	const [rejected, setRejected] = useState<ReadonlySet<string>>(() => new Set());
	const pending = progress.history.filter(
		(entry) => !entry.synced && !rejected.has(entry.id),
	).length;

	useEffect(() => {
		if (!ready) return;
		let cancelled = false;
		teachingApi<RecallArenaTurnDay>(arenaTurnsUrl(courseId, todayIso))
			.then((day) => {
				if (cancelled || !day?.turns?.length) return;
				setProgress((previous) => {
					const known = new Set(previous.history.map((entry) => entry.id));
					const saved = day.turns.filter((turn) => !known.has(turn.clientId)).map(entryFromTurn);
					if (!saved.length) return previous;
					return {
						...previous,
						history: [...saved, ...previous.history].sort((left, right) => left.at - right.at),
					};
				});
			})
			.catch(() => {
				// Local progress is still available while the history service is offline.
			})
			.finally(() => {
				if (!cancelled) setLoadedDay(dayKey);
			});
		return () => {
			cancelled = true;
		};
	}, [ready, courseId, todayIso, dayKey, setProgress]);

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

	return {
		loading: loadedDay !== dayKey,
		/** Calls this browser has not saved to the server yet. */
		pending,
		failed: failed && pending > 0,
		/** Calls the server would not take, so they stay only on this machine. */
		rejected: rejected.size,
		retry: () => setFailed(false),
	};
}
