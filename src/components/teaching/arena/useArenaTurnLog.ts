'use client';

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

import { AdminApiError, teachingApi } from '@/components/teaching/admin/api';
import type { RecallArenaTurnRecord } from '@/features/teaching/types';

import type { ArenaProgress } from './arenaGame';
import { arenaTurnsUrl, entryFromTurn, turnPayload, type RecallArenaTurnDay } from './arenaTurnLog';

/** Every call saved for the course today, all runs, oldest first; null while loading. */
export function useArenaDayTurns(courseId: string, todayIso: string) {
	const dayKey = `${courseId}:${todayIso}`;
	const [day, setDay] = useState<{ key: string; turns: RecallArenaTurnRecord[] } | null>(null);
	useEffect(() => {
		let cancelled = false;
		teachingApi<RecallArenaTurnDay>(arenaTurnsUrl(courseId, todayIso))
			.then((result) => {
				if (!cancelled) setDay({ key: dayKey, turns: result?.turns ?? [] });
			})
			.catch(() => {
				// Local progress is still available while the history service is offline.
				if (!cancelled) setDay({ key: dayKey, turns: [] });
			});
		return () => {
			cancelled = true;
		};
	}, [courseId, todayIso, dayKey]);
	return day?.key === dayKey ? day.turns : null;
}

/**
 * Keeps the course's arena log on the server in step with this browser:
 * every call is sent once (in order, retried on demand), and the run on
 * screen also picks up its turns saved by other machines.
 */
export function useArenaTurnLog({
	courseId,
	runKey,
	dayTurns,
	progress,
	setProgress,
	ready,
}: {
	courseId: string;
	/** The run on screen; its saved turns are merged in once. */
	runKey: string | null;
	/** Today's saved turns, all runs; null while loading. */
	dayTurns: readonly RecallArenaTurnRecord[] | null;
	progress: ArenaProgress;
	setProgress: Dispatch<SetStateAction<ArenaProgress>>;
	/** False until this browser's own progress for the run is read. */
	ready: boolean;
}) {
	const [mergedRun, setMergedRun] = useState<string | null>(null);
	const [failed, setFailed] = useState(false);
	const [round, setRound] = useState(0);
	const sending = useRef(false);
	/** Turns the server refused (for example a student since removed): never resent. */
	const [rejected, setRejected] = useState<ReadonlySet<string>>(() => new Set());
	const pending = progress.history.filter(
		(entry) => !entry.synced && !rejected.has(entry.id),
	).length;

	useEffect(() => {
		if (!ready || !runKey || dayTurns == null || mergedRun === runKey) return;
		const ours = dayTurns.filter((turn) => turn.runKey === runKey);
		if (ours.length) {
			setProgress((previous) => {
				const known = new Set(previous.history.map((entry) => entry.id));
				const saved = ours.filter((turn) => !known.has(turn.clientId)).map(entryFromTurn);
				if (!saved.length) return previous;
				return {
					...previous,
					history: [...saved, ...previous.history].sort((left, right) => left.at - right.at),
				};
			});
		}
		// eslint-disable-next-line react-hooks/set-state-in-effect -- marks the server log merged for this run
		setMergedRun(runKey);
	}, [ready, runKey, dayTurns, mergedRun, setProgress]);

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
		loading: !runKey || mergedRun !== runKey,
		/** Calls this browser has not saved to the server yet. */
		pending,
		failed: failed && pending > 0,
		/** Calls the server would not take, so they stay only on this machine. */
		rejected: rejected.size,
		retry: () => setFailed(false),
	};
}
