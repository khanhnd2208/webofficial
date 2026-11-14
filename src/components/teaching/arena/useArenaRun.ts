'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { RecallArenaTurnRecord } from '@/features/teaching/types';

import {
	arenaGameKey,
	emptyProgress,
	loadProgress,
	saveProgress,
	type ArenaProgress,
} from './arenaGame';
import {
	knownArenaRuns,
	loadLocalArenaRuns,
	newArenaRunKey,
	parseArenaRunKey,
	pickArenaRun,
	rememberLocalArenaRun,
	sameArenaClass,
} from './arenaRuns';
import { useArenaDayTurns, useArenaTurnLog } from './useArenaTurnLog';

/**
 * Which run (phiên) of today's game is on screen. On load it carries on the
 * latest run of the classes in the room; moving to other classes carries on
 * theirs or starts one; the lecturer can also start a fresh run on purpose.
 */
export function useArenaRun({
	courseId,
	todayIso,
	sessionIds,
	dayTurns,
	ready,
}: {
	courseId: string;
	todayIso: string;
	/** Sessions on the floor right now, sorted. */
	sessionIds: readonly string[];
	/** Today's saved turns, all runs; null while loading. */
	dayTurns: readonly RecallArenaTurnRecord[] | null;
	/** False until the lecturer's saved class choice is read. */
	ready: boolean;
}) {
	/** Null until picked; `draft` while a fresh run waits for its classes. */
	const [key, setKey] = useState<string | null>(null);
	const [draft, setDraft] = useState(false);

	const open = useCallback(
		(next: string) => {
			rememberLocalArenaRun(courseId, todayIso, next);
			setKey(next);
			setDraft(false);
		},
		[courseId, todayIso],
	);

	const carryOn = useCallback(
		(ids: readonly string[]) => {
			const runs = knownArenaRuns(dayTurns ?? [], loadLocalArenaRuns(courseId, todayIso));
			open(pickArenaRun(runs, ids) ?? newArenaRunKey(ids));
		},
		[courseId, todayIso, dayTurns, open],
	);

	const sessionsKey = sessionIds.join('+');
	useEffect(() => {
		if (!ready || dayTurns == null || key || draft) return;
		// eslint-disable-next-line react-hooks/set-state-in-effect -- picked once the server log and this browser's runs are read
		carryOn(sessionsKey ? sessionsKey.split('+') : []);
	}, [ready, dayTurns, key, draft, sessionsKey, carryOn]);

	return {
		key,
		draft,
		/** Enter the game with these sessions: keep the run unless the class period changed. */
		follow: (ids: readonly string[]) => {
			if (draft) {
				open(newArenaRunKey(ids));
				return;
			}
			// Still reading today's log: the pick above uses the classes chosen by then.
			if (!key) return;
			const current = parseArenaRunKey(key);
			if (current && sameArenaClass(current.sessionIds, ids)) return;
			carryOn(ids);
		},
		/** Clear the floor for a new run; it begins when the lecturer enters the game. */
		startDraft: () => {
			setKey(null);
			setDraft(true);
		},
	};
}

const DRAFT = 'draft';

/**
 * The run on screen with its progress: read from this browser, topped up
 * with turns other machines saved, written back on every change, and sent
 * to the server's log.
 */
export function useArenaRunProgress({
	courseId,
	todayIso,
	sessionIds,
	ready,
	onLoad,
}: {
	courseId: string;
	todayIso: string;
	sessionIds: readonly string[];
	ready: boolean;
	/** Runs each time a run's progress is read, so the screen can match it. */
	onLoad: (progress: ArenaProgress) => void;
}) {
	const dayTurns = useArenaDayTurns(courseId, todayIso);
	const run = useArenaRun({ courseId, todayIso, sessionIds, dayTurns, ready });
	const [progress, setProgress] = useState<ArenaProgress>(emptyProgress);
	const [loadedKey, setLoadedKey] = useState<string | null>(null);
	const gameKey = run.draft ? DRAFT : run.key ? arenaGameKey(courseId, todayIso, run.key) : null;
	const loaded = gameKey != null && loadedKey === gameKey;
	const onLoadRef = useRef(onLoad);
	useEffect(() => {
		onLoadRef.current = onLoad;
	});

	useEffect(() => {
		if (!gameKey) return;
		const stored = gameKey === DRAFT ? emptyProgress() : loadProgress(gameKey);
		// eslint-disable-next-line react-hooks/set-state-in-effect -- read from localStorage after hydration
		setProgress(stored);
		setLoadedKey(gameKey);
		onLoadRef.current(stored);
	}, [gameKey]);

	useEffect(() => {
		if (loaded && gameKey && gameKey !== DRAFT) saveProgress(gameKey, progress);
	}, [progress, loaded, gameKey]);

	const turnLog = useArenaTurnLog({
		courseId,
		runKey: run.key,
		dayTurns,
		progress,
		setProgress,
		ready: loaded && !run.draft,
	});

	return { run, progress, setProgress, loaded, turnLog };
}
