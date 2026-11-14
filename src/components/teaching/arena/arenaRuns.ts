/**
 * A game day splits into runs (phiên): one per class period played. Each
 * run has its own callers, retired questions, boss and summary. The key
 * names the sessions played and when the run began, so every machine can
 * tell which class a saved turn belongs to.
 */

export interface ArenaRun {
	key: string;
	/** Teaching sessions in play when the run began, sorted. */
	sessionIds: string[];
	startedAt: number;
}

export interface ArenaKnownRun extends ArenaRun {
	/** Latest moment anything happened in the run: its start or its newest turn. */
	lastAt: number;
	turns: number;
}

const SESSIONS_SEPARATOR = '+';
const TIME_SEPARATOR = '~';
const NO_SESSIONS = 'none';

/** The sessions on the floor, as a run stores them. */
export function arenaSessionIds(hosts: ReadonlyArray<{ id: string }>): string[] {
	return [...new Set(hosts.map((host) => host.id))].sort();
}

export function newArenaRunKey(sessionIds: readonly string[], now = Date.now()) {
	const sessions = sessionIds.length
		? [...sessionIds].sort().join(SESSIONS_SEPARATOR)
		: NO_SESSIONS;
	return `${sessions}${TIME_SEPARATOR}${now.toString(36)}`;
}

export function parseArenaRunKey(key: string): ArenaRun | null {
	const cut = key.lastIndexOf(TIME_SEPARATOR);
	if (cut <= 0) return null;
	const startedAt = Number.parseInt(key.slice(cut + 1), 36);
	if (!Number.isFinite(startedAt) || startedAt <= 0) return null;
	const sessions = key.slice(0, cut);
	return {
		key,
		sessionIds: sessions === NO_SESSIONS ? [] : sessions.split(SESSIONS_SEPARATOR).filter(Boolean),
		startedAt,
	};
}

/** Two runs belong to the same class period when they share a session (or both have none). */
export function sameArenaClass(left: readonly string[], right: readonly string[]) {
	if (!left.length || !right.length) return !left.length && !right.length;
	return left.some((id) => right.includes(id));
}

/**
 * Every run of the day this browser knows about: from saved turns and from
 * runs it started itself (which may have no turns yet). Newest activity first.
 */
export function knownArenaRuns(
	turns: ReadonlyArray<{ runKey: string | null; playedAt: number }>,
	localKeys: readonly string[],
): ArenaKnownRun[] {
	const runs = new Map<string, ArenaKnownRun>();
	const add = (key: string, at?: number) => {
		let run = runs.get(key);
		if (!run) {
			const parsed = parseArenaRunKey(key);
			if (!parsed) return;
			run = { ...parsed, lastAt: parsed.startedAt, turns: 0 };
			runs.set(key, run);
		}
		if (at != null) {
			run.turns += 1;
			run.lastAt = Math.max(run.lastAt, at);
		}
	};
	for (const key of localKeys) add(key);
	for (const turn of turns) if (turn.runKey) add(turn.runKey, turn.playedAt);
	return [...runs.values()].sort((left, right) => right.lastAt - left.lastAt);
}

/** The run to carry on for these sessions: the latest one of the same class period, if any. */
export function pickArenaRun(runs: readonly ArenaKnownRun[], sessionIds: readonly string[]) {
	return runs.find((run) => sameArenaClass(run.sessionIds, sessionIds))?.key ?? null;
}

/** Runs this browser started today, so a run with no turns yet is still found after a reload. */
const RUNS_KEY = (courseId: string, todayIso: string) =>
	`recall-arena:v3:runs:${courseId}:${todayIso}`;

export function loadLocalArenaRuns(courseId: string, todayIso: string): string[] {
	try {
		const raw = window.localStorage.getItem(RUNS_KEY(courseId, todayIso));
		const value: unknown = raw ? JSON.parse(raw) : [];
		return Array.isArray(value)
			? value.filter((key): key is string => typeof key === 'string' && !!parseArenaRunKey(key))
			: [];
	} catch {
		return [];
	}
}

export function rememberLocalArenaRun(courseId: string, todayIso: string, key: string) {
	try {
		const keys = loadLocalArenaRuns(courseId, todayIso).filter((item) => item !== key);
		window.localStorage.setItem(RUNS_KEY(courseId, todayIso), JSON.stringify([...keys, key]));
	} catch {
		// Private mode or full storage: the run is still found once it has a saved turn.
	}
}
