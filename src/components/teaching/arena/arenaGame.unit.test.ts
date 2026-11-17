import { describe, expect, it } from 'vitest';

import type { RecallArenaData, RecallArenaPlayer } from '@/features/teaching/types';

import {
	answeredArenaIds,
	arenaResults,
	callablePlayers,
	displayNames,
	hiddenArenaCards,
	initialConfig,
	keptArenaCards,
	manualArenaPlayers,
	matchesPlayerSearch,
	passStreak,
	toggleClass,
	type ArenaHistoryEntry,
} from './arenaGame';

const student = (
	enrollmentId: string,
	familyName: string,
	givenName: string,
	studentCode = '',
) => ({
	enrollmentId,
	familyName,
	givenName,
	studentCode: studentCode || `SV${enrollmentId}`,
});

describe('displayNames', () => {
	it('uses the given name when it is unique', () => {
		const names = displayNames([
			student('a', 'Nguyễn Văn', 'An'),
			student('b', 'Trần Thị', 'Bình'),
		]);
		expect(names.get('a')).toBe('An');
		expect(names.get('b')).toBe('Bình');
	});

	it('adds family initials only for students who share a given name', () => {
		const names = displayNames([
			student('a', 'Nguyễn Thùy', 'Linh'),
			student('b', 'Trần Khánh', 'Linh'),
			student('c', 'Lê Văn', 'Nam'),
		]);
		expect(names.get('a')).toBe('N.T.Linh');
		expect(names.get('b')).toBe('T.K.Linh');
		expect(names.get('c')).toBe('Nam');
	});

	it('adds the end of the student code when initials still collide, and keeps a two-word given name', () => {
		const names = displayNames([
			student('a', 'Nguyễn Thùy', 'Linh'),
			student('b', 'Trần Thùy', 'Linh'),
			student('c', 'Trần Thùy', 'Linh', '22100123'),
			student('d', 'Trần Thùy', 'Linh', '22100456'),
		]);
		expect(names.get('a')).toBe('N.T.Linh');
		expect(names.get('b')).toBe('T.T.Linh · SVb');
		expect(names.get('c')).toBe('T.T.Linh · 123');
		expect(names.get('d')).toBe('T.T.Linh · 456');
		const compound = displayNames([
			student('e', 'Nguyễn', 'Khánh Linh'),
			student('f', 'Phạm', 'Khánh Linh'),
		]);
		expect(compound.get('e')).toBe('N.Khánh Linh');
		expect(compound.get('f')).toBe('P.Khánh Linh');
	});
});

describe('answered once', () => {
	const entry = (enrollmentId: string, result: ArenaHistoryEntry['result']) =>
		({
			id: enrollmentId + result,
			at: 0,
			enrollmentId,
			name: '',
			cardId: null,
			result,
		}) as ArenaHistoryEntry;
	const roster = [
		{ enrollmentId: 'a', group: 'SUPPORT' },
		{ enrollmentId: 'b', group: 'SUPPORT' },
		{ enrollmentId: 'c', group: 'CHALLENGE' },
		{ enrollmentId: 'd', group: 'SUPPORT' },
	] as RecallArenaPlayer[];

	it('counts a pass or a miss as answered, never a skip', () => {
		const answered = answeredArenaIds([entry('a', 'pass'), entry('b', 'fail'), entry('d', 'skip')]);
		expect([...answered].sort()).toEqual(['a', 'b']);
	});

	it('does not count an answer given in place of a classmate as being called', () => {
		const history = [
			entry('a', 'fail'),
			{ ...entry('a', 'pass'), id: 'assist:1' },
			{ ...entry('b', 'pass'), id: 'assist:2' },
		];
		expect([...answeredArenaIds(history)]).toEqual(['a']);
		// The mark above a's head stays the miss of their own turn; b has none.
		expect([...arenaResults(history)]).toEqual([['a', 'fail']]);
		expect(callablePlayers(roster, 'SUPPORT', answeredArenaIds(history))).toHaveLength(2);
	});

	it('only calls the chosen group, and nobody who already answered', () => {
		const answered = answeredArenaIds([entry('a', 'pass'), entry('c', 'fail')]);
		const ids = (filter: 'ALL' | 'SUPPORT' | 'CHALLENGE') =>
			callablePlayers(roster, filter, answered).map((player) => player.enrollmentId);
		expect(ids('SUPPORT')).toEqual(['b', 'd']);
		expect(ids('CHALLENGE')).toEqual([]);
		expect(ids('ALL')).toEqual(['b', 'd']);
	});
});

describe('passStreak', () => {
	const entry = (result: ArenaHistoryEntry['result']): ArenaHistoryEntry => ({
		id: result,
		at: 0,
		enrollmentId: 'a',
		name: 'An',
		cardId: null,
		result,
	});

	it('counts correct answers since the last miss and ignores skipped students', () => {
		expect(passStreak([])).toBe(0);
		expect(passStreak(['pass', 'fail', 'pass', 'skip', 'pass'].map((r) => entry(r as never)))).toBe(
			2,
		);
		expect(passStreak(['pass', 'pass', 'fail'].map((r) => entry(r as never)))).toBe(0);
	});
});

describe('question fate', () => {
	let clock = 0;
	const turn = (
		cardId: string | null,
		result: ArenaHistoryEntry['result'],
		card?: ArenaHistoryEntry['card'],
	): ArenaHistoryEntry => ({
		id: `t${(clock += 1)}`,
		at: clock,
		enrollmentId: 'a',
		name: 'An',
		cardId,
		result,
		...(card ? { card } : {}),
	});

	it('hides a passed question and keeps a missed one by default', () => {
		const history = [
			turn('c1', 'pass'),
			turn('c2', 'fail'),
			turn('c3', 'skip'),
			turn(null, 'pass'),
		];
		expect([...hiddenArenaCards(history)]).toEqual(['c1']);
		expect([...keptArenaCards(history)]).toEqual(['c2']);
	});

	it('follows the lecturer: a pass can keep a question and a miss can hide it', () => {
		const history = [turn('c1', 'pass', 'keep'), turn('c2', 'fail', 'hide')];
		expect([...hiddenArenaCards(history)]).toEqual(['c2']);
		expect([...keptArenaCards(history)]).toEqual(['c1']);
	});

	it('lets the latest graded turn on a question decide, ignoring skips', () => {
		const history = [turn('c1', 'fail'), turn('c1', 'pass'), turn('c1', 'skip')];
		expect(hiddenArenaCards(history).has('c1')).toBe(true);
		expect(keptArenaCards(history).size).toBe(0);
		history.push(turn('c1', 'pass', 'keep'));
		expect(hiddenArenaCards(history).size).toBe(0);
		expect(keptArenaCards(history).has('c1')).toBe(true);
	});
});

describe('course arena setup', () => {
	const session = (id: string, classId: string, heldOn: string) => ({
		id,
		classId,
		tutorialClassId: `t-${classId}`,
		weekNumber: 4,
		heldOn,
		topic: '',
		method: 'ROLL_CALL' as const,
		isCancelled: false,
		attendanceTakenAt: null,
		attendanceOpen: false,
		participationTakenAt: null,
		participationOpen: true,
	});
	const klass = (id: string, heldOn: string, enabledDeckIds: string[]) => ({
		id,
		classCode: id.toUpperCase(),
		term: 'HK1',
		tutorials: [],
		sessions: [session(`s-${id}`, id, heldOn)],
		defaultSessionId: `s-${id}`,
		enabledDeckIds,
	});
	const deck = (deckId: string) => ({
		deckId,
		title: deckId,
		lessonLabel: '',
		status: 'PUBLISHED' as const,
		cardCount: 3,
	});
	const data: RecallArenaData = {
		course: { id: 'course', courseCode: 'HRM', courseName: 'HRM' },
		todayIso: '2026-11-11',
		classes: [klass('a', '2026-11-11', ['d2']), klass('b', '2026-11-10', ['d1'])],
		players: [
			{
				enrollmentId: 'p1',
				classId: 'b',
				tutorialClassId: 't-b',
				enrolledFromWeek: 1,
				studentCode: 'SV01',
				familyName: 'Trần',
				givenName: 'Đức',
				group: null,
				attendance: {},
				cp: {},
			},
		],
		decks: [deck('d1'), deck('d2'), deck('d3')],
		cards: [],
	};

	it('starts with the classes meeting today and the lessons they switched on', () => {
		expect(initialConfig(data, null, null)).toEqual({
			classIds: ['a'],
			sessionByClass: { a: 's-a' },
			filter: 'ALL',
			deckIds: ['d2'],
			guestIds: [],
			manualPlayers: [],
			excludedIds: [],
			heroIds: [],
			bossId: null,
		});
	});

	it('remembers the chosen heroes and boss, dropping ones that no longer exist', () => {
		const stored = { heroIds: ['lua-lem', 'retired-hero'], bossId: 'deadline' };
		expect(initialConfig(data, null, stored)).toMatchObject({
			heroIds: ['lua-lem'],
			bossId: 'deadline',
		});
		expect(initialConfig(data, null, { bossId: 'retired-boss' }).bossId).toBeNull();
	});

	it('prefers the class the lecturer came from', () => {
		expect(initialConfig(data, 'b', null).classIds).toEqual(['b']);
		expect(initialConfig(data, 'unknown', null).classIds).toEqual(['a']);
	});

	it('keeps saved lessons and filter, but saved players only on the same day', () => {
		const stored = {
			deckIds: ['d3', 'gone'],
			filter: 'SUPPORT' as const,
			guestIds: ['p1', 'gone'],
			manualPlayers: [{ id: 'arena-manual:1', name: 'Lê Minh An', group: 'SUPPORT' as const }],
			excludedIds: ['p1'],
		};
		const today = initialConfig(data, null, { ...stored, savedOn: '2026-11-11' });
		expect(today).toMatchObject({
			deckIds: ['d3'],
			filter: 'SUPPORT',
			guestIds: ['p1'],
			manualPlayers: stored.manualPlayers,
			excludedIds: ['p1'],
		});
		const lastWeek = initialConfig(data, null, { ...stored, savedOn: '2026-11-04' });
		expect(lastWeek).toMatchObject({
			deckIds: ['d3'],
			guestIds: [],
			manualPlayers: [],
			excludedIds: [],
		});
	});

	it('turns a manually named player into a callable game player without enrollment data', () => {
		const [player] = manualArenaPlayers([
			{ id: 'arena-manual:1', name: 'Lê Minh An', group: 'CHALLENGE' },
		]);
		expect(player).toMatchObject({
			enrollmentId: 'arena-manual:1',
			familyName: 'Lê Minh',
			givenName: 'An',
			group: 'CHALLENGE',
			attendance: {},
			cp: {},
		});
	});

	it('ticks a class with its default session and unticks it cleanly', () => {
		const start = initialConfig(data, null, null);
		const both = toggleClass(start, data, 'b');
		expect(both.classIds).toEqual(['a', 'b']);
		expect(both.sessionByClass).toEqual({ a: 's-a', b: 's-b' });
		const back = toggleClass(both, data, 'a');
		expect(back.classIds).toEqual(['b']);
		expect(back.sessionByClass).toEqual({ b: 's-b' });
	});

	it('finds students by name or code without accents', () => {
		const player = data.players[0]!;
		expect(matchesPlayerSearch(player, 'duc')).toBe(true);
		expect(matchesPlayerSearch(player, 'TRAN D')).toBe(true);
		expect(matchesPlayerSearch(player, 'sv01')).toBe(true);
		expect(matchesPlayerSearch(player, 'an')).toBe(true);
		expect(matchesPlayerSearch(player, 'linh')).toBe(false);
		expect(matchesPlayerSearch(player, '   ')).toBe(false);
	});
});
