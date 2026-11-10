/**
 * Pure rules for the "Kiểm tra bài cũ" recall arena: who may be called, how a
 * fair draw works, and how an awarded CP level merges with the week's mark.
 * No I/O here so both the server service and the client game can use it.
 */
import type { AttendanceStatus } from './cp';

export type ArenaGroup = 'CHALLENGE' | 'SUPPORT';
export type ArenaGroupFilter = 'ALL' | ArenaGroup;

/** CP levels a correct answer can award; the CP grid accepts 0, 0.5, 1, 2. */
export const ARENA_AWARD_LEVELS = [0.5, 1, 2] as const;
export type ArenaAwardLevel = (typeof ARENA_AWARD_LEVELS)[number];

/** Statuses that mean the student is in the room and can be called. */
const IN_ROOM: ReadonlySet<AttendanceStatus> = new Set(['PRESENT', 'LATE', 'MAKEUP']);

export function isInRoom(status: AttendanceStatus | null | undefined): boolean {
	return status != null && IN_ROOM.has(status);
}

export function matchesGroupFilter(group: ArenaGroup | null, filter: ArenaGroupFilter): boolean {
	return filter === 'ALL' || group === filter;
}

/**
 * Keep the higher of the existing week mark and the new award, so calling a
 * student again never lowers CP the lecturer already gave.
 */
export function keepHigherCp(current: number, award: ArenaAwardLevel): number {
	return Math.max(current, award);
}

export type RandomSource = () => number;

export function shuffle<T>(items: readonly T[], random: RandomSource = Math.random): T[] {
	const next = [...items];
	for (let index = next.length - 1; index > 0; index -= 1) {
		const swap = Math.floor(random() * (index + 1));
		[next[index], next[swap]] = [next[swap]!, next[index]!];
	}
	return next;
}

export interface DrawResult {
	picked: string | null;
	/** Ids still waiting for their turn after this draw. */
	bag: string[];
	/** True when everyone eligible had a turn and the bag was refilled. */
	refilled: boolean;
}

/**
 * Shuffle-bag draw: everyone eligible is called once before anyone is called
 * twice. The bag keeps only ids that are still eligible (filters and
 * attendance can change mid-game). On refill the last student called is not
 * drawn first, so nobody is called twice in a row.
 */
export function drawFromBag(
	bag: readonly string[],
	eligible: readonly string[],
	lastPicked: string | null,
	random: RandomSource = Math.random,
): DrawResult {
	const allowed = new Set(eligible);
	let pool = bag.filter((id) => allowed.has(id));
	let refilled = false;
	if (pool.length === 0) {
		if (eligible.length === 0) return { picked: null, bag: [], refilled: false };
		pool = shuffle(eligible, random);
		refilled = true;
		if (pool.length > 1 && pool[0] === lastPicked) {
			pool.push(pool.shift()!);
		}
	}
	const [picked, ...rest] = pool;
	return { picked: picked ?? null, bag: rest, refilled };
}

/**
 * Give a student their turn back (skipped or dismissed without grading). They
 * go to the end of the bag. If nobody else is waiting, the bag is refilled
 * with everyone else first, so the same student is never drawn again at once.
 */
export function returnToBag(
	bag: readonly string[],
	eligible: readonly string[],
	id: string,
	random: RandomSource = Math.random,
): string[] {
	const allowed = new Set(eligible);
	const waiting = bag.filter((item) => item !== id && allowed.has(item));
	if (waiting.length > 0) return [...waiting, id];
	return [
		...shuffle(
			eligible.filter((item) => item !== id),
			random,
		),
		id,
	];
}

/** Next unused card, or start the deck over once every card has been asked. */
export function drawCard(
	cardIds: readonly string[],
	usedIds: readonly string[],
	random: RandomSource = Math.random,
): { cardId: string | null; used: string[] } {
	if (cardIds.length === 0) return { cardId: null, used: [] };
	const used = new Set(usedIds.filter((id) => cardIds.includes(id)));
	let fresh = cardIds.filter((id) => !used.has(id));
	if (fresh.length === 0) {
		used.clear();
		fresh = [...cardIds];
	}
	const cardId = fresh[Math.floor(random() * fresh.length)]!;
	used.add(cardId);
	return { cardId, used: [...used] };
}

export interface ArenaSessionCandidate {
	id: string;
	weekNumber: number;
	heldOn: string | null;
	isCancelled: boolean;
	attendanceOpen: boolean;
	attendanceTakenAt: string | null;
}

/**
 * Default session for the arena: today's class, else the one taking
 * attendance now, else the most recent week with attendance taken.
 */
export function pickDefaultArenaSession<T extends ArenaSessionCandidate>(
	sessions: readonly T[],
	todayIso: string,
): T | null {
	const live = sessions.filter((session) => !session.isCancelled);
	return (
		live.find((session) => session.heldOn === todayIso) ??
		live.find((session) => session.attendanceOpen) ??
		[...live]
			.filter((session) => session.attendanceTakenAt)
			.sort((left, right) => right.weekNumber - left.weekNumber)[0] ??
		live[0] ??
		null
	);
}

/** Today's date in Vietnam as YYYY-MM-DD (class dates are stored as plain dates). */
export function vietnamTodayIso(now = new Date()): string {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Asia/Ho_Chi_Minh',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(now);
}
