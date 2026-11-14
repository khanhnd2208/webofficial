import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
	arenaSessionIds,
	knownArenaRuns,
	loadLocalArenaRuns,
	newArenaRunKey,
	parseArenaRunKey,
	pickArenaRun,
	rememberLocalArenaRun,
	sameArenaClass,
} from './arenaRuns';

const NINE = Date.parse('2026-11-14T02:00:00.000Z');
const ONE_PM = Date.parse('2026-11-14T06:00:00.000Z');
const THREE_PM = Date.parse('2026-11-14T08:00:00.000Z');

describe('arena run keys', () => {
	it('names the sorted sessions and the start time, and reads them back', () => {
		const key = newArenaRunKey(['s2', 's1'], NINE);
		expect(parseArenaRunKey(key)).toEqual({ key, sessionIds: ['s1', 's2'], startedAt: NINE });
	});

	it('keeps a run with no class in the room', () => {
		const key = newArenaRunKey([], NINE);
		expect(parseArenaRunKey(key)).toMatchObject({ sessionIds: [], startedAt: NINE });
	});

	it('rejects keys it did not make', () => {
		expect(parseArenaRunKey('')).toBeNull();
		expect(parseArenaRunKey('s1')).toBeNull();
		expect(parseArenaRunKey('s1~')).toBeNull();
		expect(parseArenaRunKey('~abc')).toBeNull();
	});

	it('lists the sessions on the floor once, sorted', () => {
		expect(arenaSessionIds([{ id: 'b' }, { id: 'a' }, { id: 'b' }])).toEqual(['a', 'b']);
	});

	it('treats runs sharing a session as the same class period', () => {
		expect(sameArenaClass(['s1'], ['s1', 's2'])).toBe(true);
		expect(sameArenaClass(['s1'], ['s2'])).toBe(false);
		expect(sameArenaClass([], [])).toBe(true);
		expect(sameArenaClass([], ['s1'])).toBe(false);
	});
});

describe('picking the run to carry on', () => {
	const morningA = newArenaRunKey(['sA'], NINE);
	const afternoonB = newArenaRunKey(['sB'], ONE_PM);
	const turn = (runKey: string | null, playedAt: number) => ({ runKey, playedAt });

	it('carries on the latest run of the same class', () => {
		const runs = knownArenaRuns([turn(morningA, NINE + 60_000), turn(afternoonB, ONE_PM)], []);
		expect(pickArenaRun(runs, ['sA'])).toBe(morningA);
		expect(pickArenaRun(runs, ['sB'])).toBe(afternoonB);
	});

	it('finds nothing for a class that has not played today', () => {
		const runs = knownArenaRuns([turn(morningA, NINE)], []);
		expect(pickArenaRun(runs, ['sC'])).toBeNull();
	});

	it('keeps a make-up class added to the room in the same run', () => {
		const runs = knownArenaRuns([turn(morningA, NINE)], []);
		expect(pickArenaRun(runs, ['sA', 'sB'])).toBe(morningA);
	});

	it('prefers the second period of the same class once it has begun', () => {
		const secondA = newArenaRunKey(['sA'], THREE_PM);
		const runs = knownArenaRuns([turn(morningA, NINE)], [secondA]);
		expect(pickArenaRun(runs, ['sA'])).toBe(secondA);
	});

	it('never carries on turns saved before runs existed', () => {
		const runs = knownArenaRuns([turn(null, NINE)], []);
		expect(runs).toEqual([]);
		expect(pickArenaRun(runs, ['sA'])).toBeNull();
	});

	it('counts the turns of each run and orders them by latest activity', () => {
		const runs = knownArenaRuns(
			[turn(morningA, NINE), turn(morningA, THREE_PM), turn(afternoonB, ONE_PM)],
			[afternoonB],
		);
		expect(runs.map((run) => [run.key, run.turns, run.lastAt])).toEqual([
			[morningA, 2, THREE_PM],
			[afternoonB, 1, ONE_PM],
		]);
	});
});

describe('runs this browser started', () => {
	beforeEach(() => {
		const items = new Map<string, string>();
		vi.stubGlobal('window', {
			localStorage: {
				getItem: (key: string) => items.get(key) ?? null,
				setItem: (key: string, value: string) => void items.set(key, value),
			},
		});
	});
	afterEach(() => vi.unstubAllGlobals());

	it('remembers each run once, per course and day', () => {
		const key = newArenaRunKey(['sA'], NINE);
		rememberLocalArenaRun('course-1', '2026-11-14', key);
		rememberLocalArenaRun('course-1', '2026-11-14', key);
		expect(loadLocalArenaRuns('course-1', '2026-11-14')).toEqual([key]);
		expect(loadLocalArenaRuns('course-1', '2026-11-15')).toEqual([]);
	});

	it('ignores storage it cannot read', () => {
		window.localStorage.setItem('recall-arena:v3:runs:course-1:2026-11-14', '{oops');
		expect(loadLocalArenaRuns('course-1', '2026-11-14')).toEqual([]);
	});
});
