import { GRAPHIC_COLORS } from '@/config/graphicColors';
import {
	isInRoom,
	matchesGroupFilter,
	type ArenaGroupFilter,
} from '@/features/teaching/domain/recallArena';
import type { RecallArenaPlayer, TeachingSessionRecord } from '@/features/teaching/types';

export const ARENA_MAX_HP = 10;

export type ArenaResult = 'pass' | 'fail' | 'skip';

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
	saveError?: string;
}

/** Per-session progress, kept in this browser so a reload does not lose the game. */
export interface ArenaProgress {
	bag: string[];
	lastPicked: string | null;
	usedCards: string[];
	hp: number;
	round: number;
	history: ArenaHistoryEntry[];
}

export interface ArenaConfig {
	sessionId: string | null;
	filter: ArenaGroupFilter;
	/** Empty means every deck enabled for the class. */
	deckIds: string[];
}

export function emptyProgress(): ArenaProgress {
	return { bag: [], lastPicked: null, usedCards: [], hp: ARENA_MAX_HP, round: 1, history: [] };
}

const PROGRESS_KEY = (sessionId: string) => `recall-arena:v1:progress:${sessionId}`;
const CONFIG_KEY = (classId: string) => `recall-arena:v1:config:${classId}`;

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

export function loadProgress(sessionId: string): ArenaProgress {
	const stored = readJson<Partial<ArenaProgress>>(PROGRESS_KEY(sessionId));
	if (!stored) return emptyProgress();
	return {
		...emptyProgress(),
		...stored,
		history: Array.isArray(stored.history) ? stored.history : [],
	};
}

export function saveProgress(sessionId: string, progress: ArenaProgress) {
	writeJson(PROGRESS_KEY(sessionId), progress);
}

export function loadConfig(classId: string): Partial<ArenaConfig> | null {
	return readJson<Partial<ArenaConfig>>(CONFIG_KEY(classId));
}

export function saveConfig(classId: string, config: ArenaConfig) {
	writeJson(CONFIG_KEY(classId), config);
}

/** Students who are in the room for this session and match the group filter. */
export function eligiblePlayers(
	players: readonly RecallArenaPlayer[],
	session: TeachingSessionRecord | null,
	filter: ArenaGroupFilter,
): RecallArenaPlayer[] {
	if (!session) return [];
	return players.filter(
		(player) =>
			player.tutorialClassId === session.tutorialClassId &&
			player.enrolledFromWeek <= session.weekNumber &&
			isInRoom(player.attendance[session.id]) &&
			matchesGroupFilter(player.group, filter),
	);
}

/** Students in the room for this session, before the group filter. */
export function playersInRoom(
	players: readonly RecallArenaPlayer[],
	session: TeachingSessionRecord | null,
): RecallArenaPlayer[] {
	return eligiblePlayers(players, session, 'ALL');
}

export function fullName(player: Pick<RecallArenaPlayer, 'familyName' | 'givenName'>) {
	return `${player.familyName} ${player.givenName}`.trim();
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

function hash(value: string): number {
	let result = 2166136261;
	for (let index = 0; index < value.length; index += 1) {
		result ^= value.charCodeAt(index);
		result = Math.imul(result, 16777619);
	}
	return result >>> 0;
}

const SHIRTS = [
	'ea580c',
	'15803d',
	'2563eb',
	'7c3aed',
	'db2777',
	'ca8a04',
	'dc2626',
	'5b7fb5',
] as const;
const SKINS = ['f6d3b3', 'e8b98f', 'd19a6a', 'a8714a'] as const;
const HAIRS = ['1a1a1a', '201608', '1c1509', '111827'] as const;

export interface AvatarLook {
	shirt: string;
	skin: string;
	hair: string;
	/** 0 short hair, 1 long hair, 2 cap. */
	style: 0 | 1 | 2;
}

/** Stable look per student, derived from the student code: no images to manage. */
export function avatarLook(seed: string): AvatarLook {
	const value = hash(seed);
	return {
		shirt: GRAPHIC_COLORS[SHIRTS[value % SHIRTS.length]!],
		skin: GRAPHIC_COLORS[SKINS[(value >>> 3) % SKINS.length]!],
		hair: GRAPHIC_COLORS[HAIRS[(value >>> 6) % HAIRS.length]!],
		style: ((value >>> 9) % 3) as AvatarLook['style'],
	};
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
