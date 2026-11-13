import {
	buildArenaRoster,
	matchesGroupFilter,
	type ArenaGroup,
	type ArenaGroupFilter,
} from '@/features/teaching/domain/recallArena';
import { ARENA_BOSSES } from './arenaBosses';
import { ARENA_CHARACTERS } from './arenaCharacters';

import type {
	RecallArenaData,
	RecallArenaPlayer,
	TeachingSessionRecord,
} from '@/features/teaching/types';

export const ARENA_MAX_HP = 10;

/** Correct answers in a row up to now; a skipped student does not break it. */
export function passStreak(history: readonly ArenaHistoryEntry[]) {
	let streak = 0;
	for (let index = history.length - 1; index >= 0; index -= 1) {
		const result = history[index]!.result;
		if (result === 'fail') break;
		if (result === 'pass') streak += 1;
	}
	return streak;
}

export type ArenaResult = 'pass' | 'fail' | 'skip';

export function passedArenaCards(history: readonly ArenaHistoryEntry[]) {
	const ids = new Set<string>();
	for (const entry of history) {
		if (entry.result === 'pass' && entry.cardId) ids.add(entry.cardId);
	}
	return ids;
}

/**
 * Students who already answered today, pass or fail. Each student answers
 * once per game day; a skipped turn does not count.
 */
export function answeredArenaIds(history: readonly ArenaHistoryEntry[]) {
	const ids = new Set<string>();
	for (const entry of history) {
		if (entry.result !== 'skip') ids.add(entry.enrollmentId);
	}
	return ids;
}

export interface ArenaHistoryEntry {
	id: string;
	at: number;
	enrollmentId: string;
	name: string;
	cardId: string | null;
	result: ArenaResult;
	/** CP level the lecturer chose for a pass. */
	award?: number;
	/** CP saved for the week after the pass, when the save succeeded. */
	cpAfter?: number;
	/** Gift count returned by the server after a missed answer. */
	giftAfter?: number;
	saveError?: string;
	/** Group of a player typed in by hand, kept so the server log has it. */
	group?: ArenaGroup;
	/** True once the server has this turn in the course's arena log. */
	synced?: boolean;
}

/** Per-session progress, kept in this browser so a reload does not lose the game. */
export interface ArenaProgress {
	bag: string[];
	lastPicked: string | null;
	hp: number;
	round: number;
	history: ArenaHistoryEntry[];
	/** Hero handed to each student today, spread evenly over the cast. */
	heroes: Record<string, string>;
}

export interface ArenaConfig {
	/** Classes in the room, in the order they were ticked. */
	classIds: string[];
	/** The session played for each ticked class. */
	sessionByClass: Record<string, string>;
	filter: ArenaGroupFilter;
	/** Lessons the questions come from. Empty means "ask your own question". */
	deckIds: string[];
	/** Students added by hand, for example a make-up student from another class. */
	guestIds: string[];
	/** Players who are not enrolled in this course, kept only in this browser for today. */
	manualPlayers: ArenaManualPlayer[];
	/** Students in the room the lecturer took out of the game. */
	excludedIds: string[];
	/** Heroes handed out to students. Empty means the whole catalogue. */
	heroIds: string[];
	/** The boss every round, or null to let the bosses take turns. */
	bossId: string | null;
}

export interface ArenaManualPlayer {
	id: string;
	name: string;
	group: ArenaGroup;
}

const MANUAL_ID_PREFIX = 'arena-manual:';

export function isManualPlayer(id: string) {
	return id.startsWith(MANUAL_ID_PREFIX);
}

export function newManualPlayer(name: string, group: ArenaGroup): ArenaManualPlayer {
	return {
		id: `${MANUAL_ID_PREFIX}${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
		name: name.trim(),
		group,
	};
}

function validManualPlayers(value: unknown): ArenaManualPlayer[] {
	if (!Array.isArray(value)) return [];
	const seen = new Set<string>();
	return value.filter((item): item is ArenaManualPlayer => {
		if (!item || typeof item !== 'object') return false;
		const player = item as Partial<ArenaManualPlayer>;
		if (
			typeof player.id !== 'string' ||
			!isManualPlayer(player.id) ||
			seen.has(player.id) ||
			typeof player.name !== 'string' ||
			!player.name.trim() ||
			player.name.length > 80 ||
			(player.group !== 'CHALLENGE' && player.group !== 'SUPPORT')
		)
			return false;
		seen.add(player.id);
		return true;
	});
}

/** Adapt a manually entered name to the same game model, without a real enrollment. */
export function manualArenaPlayers(players: readonly ArenaManualPlayer[]): RecallArenaPlayer[] {
	return players.map(({ id, name, group }) => {
		const parts = name.trim().split(/\s+/);
		const givenName = parts.pop() ?? '';
		return {
			enrollmentId: id,
			classId: '',
			tutorialClassId: null,
			enrolledFromWeek: 0,
			studentCode: id,
			familyName: parts.join(' '),
			givenName,
			group,
			attendance: {},
			cp: {},
		};
	});
}

/** What a browser remembers between visits. Players only count for the same day. */
interface StoredArenaConfig extends Partial<ArenaConfig> {
	savedOn?: string;
}

export function emptyProgress(): ArenaProgress {
	return { bag: [], lastPicked: null, hp: ARENA_MAX_HP, round: 1, history: [], heroes: {} };
}

/** One game per course per day: tomorrow's class starts with a fresh boss. */
const PROGRESS_KEY = (gameKey: string) => `recall-arena:v2:progress:${gameKey}`;
const CONFIG_KEY = (courseId: string) => `recall-arena:v2:config:${courseId}`;

export function arenaGameKey(courseId: string, todayIso: string) {
	return `${courseId}:${todayIso}`;
}

function readJson<T>(key: string): T | null {
	try {
		const raw = window.localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : null;
	} catch {
		return null;
	}
}

function writeJson(key: string, value: unknown) {
	try {
		window.localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// Private mode or full storage: the game still works, it just forgets on reload.
	}
}

export function loadProgress(gameKey: string): ArenaProgress {
	const stored = readJson<Partial<ArenaProgress>>(PROGRESS_KEY(gameKey));
	if (!stored) return emptyProgress();
	return {
		...emptyProgress(),
		bag: stored.bag ?? [],
		lastPicked: stored.lastPicked ?? null,
		hp: stored.hp ?? ARENA_MAX_HP,
		round: stored.round ?? 1,
		history: Array.isArray(stored.history) ? stored.history : [],
		heroes: validHeroes(stored.heroes),
	};
}

function validHeroes(value: unknown): Record<string, string> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
	return Object.fromEntries(
		Object.entries(value).filter((pair): pair is [string, string] => typeof pair[1] === 'string'),
	);
}

export function saveProgress(gameKey: string, progress: ArenaProgress) {
	writeJson(PROGRESS_KEY(gameKey), progress);
}

export function loadConfig(courseId: string): StoredArenaConfig | null {
	return readJson<StoredArenaConfig>(CONFIG_KEY(courseId));
}

export function saveConfig(courseId: string, config: ArenaConfig, todayIso: string) {
	writeJson(CONFIG_KEY(courseId), { ...config, savedOn: todayIso } satisfies StoredArenaConfig);
}

function onlyKnown(ids: unknown, known: ReadonlySet<string>): string[] {
	return Array.isArray(ids)
		? [...new Set(ids.filter((id): id is string => typeof id === 'string' && known.has(id)))]
		: [];
}

/** Lessons switched on for the ticked classes, in course order. */
export function enabledDecksFor(data: RecallArenaData, classIds: readonly string[]) {
	const enabled = new Set(
		data.classes
			.filter((item) => classIds.includes(item.id))
			.flatMap((item) => item.enabledDeckIds),
	);
	return data.decks.map((deck) => deck.deckId).filter((id) => enabled.has(id));
}

/**
 * Where a new game starts. Classes: the one the lecturer came from, else the
 * classes meeting today, else the ones ticked last time. Each class plays
 * its default session (today's). Players added or removed by hand only carry
 * over within the same day. Lessons: last choice, else the lessons the
 * ticked classes have switched on.
 */
export function initialConfig(
	data: RecallArenaData,
	initialClassId: string | null,
	stored: StoredArenaConfig | null,
): ArenaConfig {
	const classIds = new Set(data.classes.map((item) => item.id));
	const playerIds = new Set(data.players.map((player) => player.enrollmentId));
	const deckIds = new Set(data.decks.map((deck) => deck.deckId));
	const today = data.classes
		.filter((item) =>
			item.sessions.some(
				(session) => session.id === item.defaultSessionId && session.heldOn === data.todayIso,
			),
		)
		.map((item) => item.id);
	const remembered = onlyKnown(stored?.classIds, classIds);
	const chosen =
		initialClassId && classIds.has(initialClassId)
			? [initialClassId]
			: today.length
				? today
				: remembered;
	const sameDay = stored?.savedOn === data.todayIso;
	const storedDecks = onlyKnown(stored?.deckIds, deckIds);
	const filter = stored?.filter;
	return {
		classIds: chosen,
		sessionByClass: defaultSessions(data, chosen),
		filter: filter === 'CHALLENGE' || filter === 'SUPPORT' ? filter : 'ALL',
		deckIds: storedDecks.length ? storedDecks : enabledDecksFor(data, chosen),
		guestIds: sameDay ? onlyKnown(stored?.guestIds, playerIds) : [],
		manualPlayers: sameDay ? validManualPlayers(stored?.manualPlayers) : [],
		excludedIds: sameDay ? onlyKnown(stored?.excludedIds, playerIds) : [],
		heroIds: onlyKnown(stored?.heroIds, new Set(ARENA_CHARACTERS.map((hero) => hero.id))),
		bossId: ARENA_BOSSES.some((boss) => boss.id === stored?.bossId) ? stored!.bossId! : null,
	};
}

function defaultSessions(data: RecallArenaData, classIds: readonly string[]) {
	const result: Record<string, string> = {};
	for (const item of data.classes) {
		if (classIds.includes(item.id) && item.defaultSessionId) {
			result[item.id] = item.defaultSessionId;
		}
	}
	return result;
}

/** Tick or untick a class; a newly ticked class plays its default session. */
export function toggleClass(config: ArenaConfig, data: RecallArenaData, classId: string) {
	if (config.classIds.includes(classId)) {
		const sessionByClass = { ...config.sessionByClass };
		delete sessionByClass[classId];
		return { ...config, classIds: config.classIds.filter((id) => id !== classId), sessionByClass };
	}
	return {
		...config,
		classIds: [...config.classIds, classId],
		sessionByClass: { ...config.sessionByClass, ...defaultSessions(data, [classId]) },
	};
}

/** The chosen session of each ticked class, in class order; classes without one are skipped. */
export function hostSessions(
	config: ArenaConfig,
	sessions: readonly TeachingSessionRecord[],
): TeachingSessionRecord[] {
	const byId = new Map(sessions.map((session) => [session.id, session]));
	return config.classIds
		.map((classId) => byId.get(config.sessionByClass[classId] ?? ''))
		.filter((session): session is TeachingSessionRecord => Boolean(session));
}

/** Everyone on the floor: in the room at a chosen session, plus guests, minus removed. */
export function arenaRoster(
	players: readonly RecallArenaPlayer[],
	hosts: readonly TeachingSessionRecord[],
	config: Pick<ArenaConfig, 'guestIds' | 'excludedIds'>,
): RecallArenaPlayer[] {
	return buildArenaRoster(players, hosts, config.guestIds, config.excludedIds);
}

/**
 * Students the monster may call: the floor, narrowed by the group filter,
 * minus anyone who already answered today.
 */
export function callablePlayers(
	roster: readonly RecallArenaPlayer[],
	filter: ArenaGroupFilter,
	answered: ReadonlySet<string> = new Set(),
): RecallArenaPlayer[] {
	return roster.filter(
		(player) => matchesGroupFilter(player.group, filter) && !answered.has(player.enrollmentId),
	);
}

/** Search the whole course by name or student code, ignoring accents and case. */
export function matchesPlayerSearch(
	player: Pick<RecallArenaPlayer, 'familyName' | 'givenName' | 'studentCode'>,
	query: string,
) {
	const fold = (value: string) =>
		value
			.normalize('NFD')
			.replace(/\p{Diacritic}/gu, '')
			.replace(/đ/g, 'd')
			.replace(/Đ/g, 'D')
			.toLocaleLowerCase('vi')
			.trim();
	const needle = fold(query);
	if (!needle) return false;
	return (
		fold(`${player.familyName} ${player.givenName}`).includes(needle) ||
		fold(player.studentCode).includes(needle)
	);
}

export function fullName(player: Pick<RecallArenaPlayer, 'familyName' | 'givenName'>) {
	return `${player.familyName} ${player.givenName}`.trim();
}

/** A pasted name is linked only when it identifies one enrollment in the course. */
export function importArenaNames(
	text: string,
	group: ArenaGroup,
	players: readonly RecallArenaPlayer[],
	config: ArenaConfig,
	roster: readonly RecallArenaPlayer[],
) {
	const rosterIds = new Set(roster.map((player) => player.enrollmentId));
	const enrolledByName = new Map<string, RecallArenaPlayer[]>();
	for (const player of players) {
		const key = nameKey(fullName(player).replace(/\s+/g, ' '));
		const matches = enrolledByName.get(key) ?? [];
		matches.push(player);
		enrolledByName.set(key, matches);
	}
	const seen = new Set(config.manualPlayers.map((player) => nameKey(player.name)));
	const guests = new Set(config.guestIds);
	const excluded = new Set(config.excludedIds);
	const manualPlayers = [...config.manualPlayers];
	const remaining: string[] = [];
	let enrolled = 0;
	let guestsAdded = 0;
	let duplicates = 0;
	let ambiguous = 0;
	let tooLong = 0;
	for (const raw of text.split(/[\r\n,;\t|]+/)) {
		const name = raw.trim().replace(/\s+/g, ' ');
		if (!name) continue;
		const key = nameKey(name);
		if (seen.has(key)) {
			duplicates += 1;
			continue;
		}
		seen.add(key);
		const matches = enrolledByName.get(key) ?? [];
		if (matches.length > 1) {
			ambiguous += 1;
			remaining.push(name);
		} else if (matches.length === 1) {
			const id = matches[0]!.enrollmentId;
			if (rosterIds.has(id)) {
				duplicates += 1;
			} else {
				excluded.delete(id);
				guests.add(id);
				enrolled += 1;
			}
		} else if (name.length > 80) {
			tooLong += 1;
			remaining.push(name);
		} else {
			manualPlayers.push(newManualPlayer(name, group));
			guestsAdded += 1;
		}
	}
	return {
		config: { ...config, guestIds: [...guests], excludedIds: [...excluded], manualPlayers },
		enrolled,
		guestsAdded,
		duplicates,
		ambiguous,
		tooLong,
		remaining,
	};
}

type NamedPlayer = Pick<
	RecallArenaPlayer,
	'enrollmentId' | 'familyName' | 'givenName' | 'studentCode'
>;

function nameKey(value: string) {
	return value.normalize('NFC').toLocaleLowerCase('vi');
}

/**
 * The name the class sees: the given name, made longer only where two
 * students would otherwise look the same ("Linh" → "Thùy Linh" → full name →
 * full name plus the end of the student code).
 */
export function displayNames(players: readonly NamedPlayer[]): Map<string, string> {
	const steps: Array<(player: NamedPlayer) => string> = [
		(player) => player.givenName.trim() || player.familyName.trim(),
		(player) => {
			const middle = player.familyName.trim().split(/\s+/).at(-1) ?? '';
			return `${middle} ${player.givenName}`.trim();
		},
		(player) => fullName(player),
		(player) => `${fullName(player)} · ${player.studentCode.slice(-3)}`,
	];
	const result = new Map<string, string>();
	let pending = [...players];
	for (const [index, step] of steps.entries()) {
		const counts = new Map<string, number>();
		for (const player of pending) {
			const key = nameKey(step(player));
			counts.set(key, (counts.get(key) ?? 0) + 1);
		}
		const isLast = index === steps.length - 1;
		pending = pending.filter((player) => {
			const label = step(player);
			if (isLast || counts.get(nameKey(label)) === 1) {
				result.set(player.enrollmentId, label);
				return false;
			}
			return true;
		});
		if (pending.length === 0) break;
	}
	return result;
}

export function sessionLabel(
	session: TeachingSessionRecord,
	tutorials: ReadonlyArray<{ id: string; code: string }>,
) {
	const tutorial = tutorials.find((item) => item.id === session.tutorialClassId);
	const date = session.heldOn ? session.heldOn.split('-').reverse().join('/') : 'chưa có ngày';
	const tutorialPart = tutorials.length > 1 && tutorial ? ` · ${tutorial.code}` : '';
	return `Tuần ${session.weekNumber}${tutorialPart} · ${date}`;
}

export function isCpFinalized(session: TeachingSessionRecord) {
	return Boolean(session.participationTakenAt) && !session.participationOpen;
}
