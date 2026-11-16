'use client';

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

import { AdminApiError } from '@/components/teaching/admin/api';
import type { RecallArenaTurnRecord } from '@/features/teaching/types';

import type { ArenaGrade, ArenaHistoryEntry, ArenaProgress } from './arenaGame';
import {
	applySavedGrade,
	arenaErrorMessage,
	arenaPost,
	arenaTurnsUrl,
	turnPayload,
} from './arenaTurnLog';

/** Wait before sending again after a failed save: 5 s, then doubling, at most a minute. */
export function arenaRetryDelay(failures: number) {
	return Math.min(60_000, 5_000 * 2 ** Math.max(0, failures - 1));
}

/**
 * Sends every call of this browser's phiên to the course's arena log on the
 * server, once each, in order. A call that gets no answer is sent again on
 * its own (sooner when the browser comes back online); a call the server
 * refuses is not. The phiên itself lives in this browser: the server log is a
 * record of past calls, never pulled back into a running phiên.
 */
export function useArenaTurnLog({
	courseId,
	progress,
	setProgress,
	ready,
	onGradeSaved,
	onGradeRefused,
}: {
	courseId: string;
	progress: ArenaProgress;
	setProgress: Dispatch<SetStateAction<ArenaProgress>>;
	/** False until this browser's own progress is read. */
	ready: boolean;
	/** A grade saved late (see `pendingGrade`) is now confirmed. */
	onGradeSaved?: (entry: ArenaHistoryEntry, grade: ArenaGrade, message: string) => void;
	/** The server refused a grade saved late, so that CP or Gift was not written. */
	onGradeRefused?: (entry: ArenaHistoryEntry, message: string) => void;
}) {
	/** Failed sends in a row; 0 while saves go through. */
	const [failures, setFailures] = useState(0);
	const [waiting, setWaiting] = useState(false);
	const [round, setRound] = useState(0);
	const sending = useRef(false);
	const callbacks = useRef({ onGradeSaved, onGradeRefused });
	useEffect(() => {
		callbacks.current = { onGradeSaved, onGradeRefused };
	});
	/** Turns the server refused (for example a student since removed): never resent. */
	const [rejected, setRejected] = useState<ReadonlySet<string>>(() => new Set());
	const pending = progress.history.filter(
		(entry) => !entry.synced && !rejected.has(entry.id),
	).length;

	useEffect(() => {
		if (!ready || waiting || sending.current) return;
		const next = progress.history.find((entry) => !entry.synced && !rejected.has(entry.id));
		if (!next) return;
		sending.current = true;
		arenaPost<RecallArenaTurnRecord>(arenaTurnsUrl(courseId), turnPayload(next))
			.then((saved) => {
				setFailures(0);
				const grade = next.pendingGrade;
				if (grade) {
					const done = applySavedGrade(next, grade, saved, next.name);
					setProgress((previous) => ({
						...previous,
						history: previous.history.map((entry) => (entry.id === next.id ? done.entry : entry)),
					}));
					callbacks.current.onGradeSaved?.(done.entry, grade, done.message);
					return;
				}
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
					if (next.pendingGrade) callbacks.current.onGradeRefused?.(next, arenaErrorMessage(error));
				} else {
					setFailures((count) => count + 1);
					setWaiting(true);
				}
			})
			.finally(() => {
				sending.current = false;
				setRound((value) => value + 1);
			});
	}, [ready, waiting, round, rejected, progress.history, courseId, setProgress]);

	// After a failure: send again after a pause, or as soon as the network is back.
	useEffect(() => {
		if (!waiting) return;
		const resume = () => setWaiting(false);
		const timer = window.setTimeout(resume, arenaRetryDelay(failures));
		window.addEventListener('online', resume);
		return () => {
			window.clearTimeout(timer);
			window.removeEventListener('online', resume);
		};
	}, [waiting, failures]);

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
		/** The last send failed; the log is waiting to send again. */
		failed: failures > 0 && pending > 0,
		/** Calls the server would not take, so they stay only on this machine. */
		rejected: rejected.size,
		/** Send again now instead of waiting for the next automatic try. */
		retry: () => setWaiting(false),
	};
}
