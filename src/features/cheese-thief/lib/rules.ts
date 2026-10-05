import {
	SCAPEGOAT_MIN_PLAYERS,
	presetFor,
	type FollowerSettings,
	type TablePreset,
} from '@/features/cheese-thief/config/cheeseThief';

export type CheeseRole = 'thief' | 'sleepyhead' | 'scapegoat';
export type CheeseWinner = 'sleepyheads' | 'thief' | 'scapegoat';

export interface Seat {
	id: string;
	role: CheeseRole;
	/** The one wake-up number, 1–6. */
	dice: number[];
}

export interface ResolvedSecret {
	followerIds: string[];
	/** Player id → the id whose number they looked at. */
	peekByPlayer: Record<string, string>;
	/** Player id → who they think the Thief is. */
	hunchByPlayer: Record<string, string>;
}

export interface SecretJob {
	/** Null when this player does not name followers. */
	followers: { count: number; pool: string[] } | null;
	peek: boolean;
}

export interface SecretCard {
	peek: { name: string; hours: number[] } | null;
	/** Set on the Thief's card when they have followers. */
	allies: string[] | null;
	/** Set on anyone the Thief recruited, including a Scapegoat who keeps their own win. */
	recruited: { thiefName: string | null; allyNames: string[] } | null;
}

export interface VoteBallot {
	voterId: string;
	targetId: string;
}

export type VoteResolution =
	| { kind: 'tie'; candidateIds: string[] }
	| { kind: 'flip'; flippedIds: string[] };

function shuffle<T>(items: T[], rng: () => number): T[] {
	const copy = [...items];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		const swap = copy[i]!;
		copy[i] = copy[j]!;
		copy[j] = swap;
	}
	return copy;
}

function rollDie(rng: () => number): number {
	return 1 + Math.floor(rng() * 6);
}

export function deal(
	ids: string[],
	scapegoat: boolean,
	rng: () => number,
	followers?: FollowerSettings,
): { seats: Seat[]; preset: TablePreset } {
	const preset = presetFor(ids.length, followers);
	const order = shuffle(ids, rng);
	const useScapegoat = scapegoat && ids.length >= SCAPEGOAT_MIN_PLAYERS;
	const seats = order.map((id, index) => {
		const role: CheeseRole =
			index === 0 ? 'thief' : useScapegoat && index === 1 ? 'scapegoat' : 'sleepyhead';
		return { id, role, dice: [rollDie(rng)] };
	});
	return { seats, preset };
}

/** The hour this seat opens their eyes. Every player has exactly one. */
export function wakeHoursOf(seat: Seat): number[] {
	return seat.dice[0] === undefined ? [] : [seat.dice[0]];
}

/** The Thief takes the cheese at their only wake hour. */
export function theftHourOf(seat: Seat): number {
	return Math.min(...wakeHoursOf(seat));
}

export function awakeAt(seats: Seat[], hour: number): Seat[] {
	return seats.filter((seat) => wakeHoursOf(seat).includes(hour));
}

export function findThief(seats: Seat[]): Seat {
	const thief = seats.find((seat) => seat.role === 'thief');
	if (!thief) throw new Error('Cheese Thief deal is missing a Thief');
	return thief;
}

export function wasAlone(seat: Seat, seats: Seat[]): boolean {
	const hours = wakeHoursOf(seat);
	if (hours.length !== 1) return false;
	return awakeAt(seats, hours[0]!).length === 1;
}

/**
 * A Sleepyhead or Scapegoat awake with nobody else may peek.
 * The Thief never peeks. A table of 4 has no peek at all.
 */
export function canPeek(seat: Seat, seats: Seat[], preset: TablePreset): boolean {
	if (!preset.peek) return false;
	return seat.role !== 'thief' && wasAlone(seat, seats);
}

/**
 * Same number of taps for every phone, fixed by the table settings alone.
 * It grows with the number of followers the Thief names, and never drops below 1.
 */
export function sharedChoiceCount(preset: TablePreset): number {
	return Math.max(1, preset.followerPickCount);
}

export function secretJobFor(seat: Seat, seats: Seat[], preset: TablePreset): SecretJob {
	const others = seats.filter((other) => other.id !== seat.id).map((other) => other.id);
	let followers: SecretJob['followers'] = null;
	if (seat.role === 'thief' && preset.followerMode === 'pick') {
		followers = { count: preset.followerPickCount, pool: others };
	}
	return { followers, peek: canPeek(seat, seats, preset) };
}

function takeFromPool(picks: string[], pool: string[], count: number): string[] {
	const allowed = new Set(pool);
	const chosen: string[] = [];
	for (const pick of picks) {
		if (!allowed.has(pick) || chosen.includes(pick)) continue;
		chosen.push(pick);
		if (chosen.length === count) break;
	}
	return chosen;
}

function drawRandom(pool: string[], rng: () => number): string {
	const index = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
	return pool[index]!;
}

function slotsOf(
	picks: string[],
	job: SecretJob,
): { followerPicks: string[]; peekPick?: string; rest: string[] } {
	let cursor = 0;
	const count = job.followers?.count ?? 0;
	const followerPicks = picks.slice(cursor, cursor + count);
	cursor += count;
	const peekPick = job.peek ? picks[cursor] : undefined;
	if (job.peek) cursor += 1;
	return {
		followerPicks,
		...(peekPick !== undefined ? { peekPick } : {}),
		rest: picks.slice(cursor),
	};
}

export function resolveSecret(
	seats: Seat[],
	preset: TablePreset,
	picksByPlayer: Record<string, string[]>,
	rng: () => number,
): ResolvedSecret {
	const peekByPlayer: Record<string, string> = {};
	const hunchByPlayer: Record<string, string> = {};
	let followerIds: string[] = [];
	const thief = findThief(seats);
	const thiefSlots = slotsOf(picksByPlayer[thief.id] ?? [], secretJobFor(thief, seats, preset));

	if (preset.followerMode === 'pick') {
		const pool = seats.filter((seat) => seat.id !== thief.id).map((seat) => seat.id);
		const chosen = takeFromPool(thiefSlots.followerPicks, pool, preset.followerPickCount);
		const remaining = pool.filter((id) => !chosen.includes(id));
		while (chosen.length < preset.followerPickCount && remaining.length > 0) {
			const next = drawRandom(remaining, rng);
			chosen.push(next);
			remaining.splice(remaining.indexOf(next), 1);
		}
		followerIds = chosen;
	}

	for (const seat of seats) {
		const job = secretJobFor(seat, seats, preset);
		const others = new Set(seats.filter((other) => other.id !== seat.id).map((other) => other.id));
		const slots = seat.id === thief.id ? thiefSlots : slotsOf(picksByPlayer[seat.id] ?? [], job);
		if (job.peek && slots.peekPick && others.has(slots.peekPick))
			peekByPlayer[seat.id] = slots.peekPick;
		const hunch = slots.rest.find((id) => others.has(id));
		if (hunch) hunchByPlayer[seat.id] = hunch;
	}

	return { followerIds, peekByPlayer, hunchByPlayer };
}

export function secretCardFor(
	playerId: string,
	seats: Seat[],
	names: ReadonlyMap<string, string>,
	preset: TablePreset,
	resolved: ResolvedSecret,
): SecretCard {
	const seat = seats.find((item) => item.id === playerId);
	const peekTarget = resolved.peekByPlayer[playerId];
	const peekSeat = peekTarget ? seats.find((item) => item.id === peekTarget) : undefined;
	const peek = peekSeat
		? {
				name: names.get(peekSeat.id) ?? peekSeat.id,
				hours: wakeHoursOf(peekSeat),
			}
		: null;

	const thief = findThief(seats);
	const allies =
		seat?.role === 'thief' && preset.thiefKnowsFollowers && resolved.followerIds.length > 0
			? resolved.followerIds.map((id) => names.get(id) ?? id)
			: null;

	const recruited = resolved.followerIds.includes(playerId)
		? {
				thiefName: preset.followersKnowThief ? (names.get(thief.id) ?? thief.id) : null,
				allyNames: preset.followersKnowEachOther
					? resolved.followerIds.filter((id) => id !== playerId).map((id) => names.get(id) ?? id)
					: [],
			}
		: null;

	return { peek, allies, recruited };
}

export function cardIsEmpty(card: SecretCard): boolean {
	return card.peek === null && card.allies === null && card.recruited === null;
}

export function tallyVotes(ballots: VoteBallot[], candidateIds?: string[]): Map<string, number> {
	const allowed = candidateIds ? new Set(candidateIds) : null;
	const tally = new Map<string, number>();
	for (const ballot of ballots) {
		if (ballot.voterId === ballot.targetId) continue;
		if (allowed && !allowed.has(ballot.targetId)) continue;
		tally.set(ballot.targetId, (tally.get(ballot.targetId) ?? 0) + 1);
	}
	return tally;
}

function leadersOf(tally: Map<string, number>): string[] {
	let best = 0;
	for (const votes of tally.values()) best = Math.max(best, votes);
	if (best === 0) return [];
	return [...tally.entries()].filter(([, votes]) => votes === best).map(([id]) => id);
}

/**
 * A unique leader is flipped. A tie stays a tie — the table talks, then votes again
 * inside that group, until one name is ahead. There is no "flip them all" escape.
 */
export function resolveVote(ballots: VoteBallot[], candidateIds: string[]): VoteResolution {
	const tally = tallyVotes(ballots, candidateIds.length > 0 ? candidateIds : undefined);
	const leaders = leadersOf(tally);
	if (leaders.length === 1) return { kind: 'flip', flippedIds: leaders };
	const tied = leaders.length > 0 ? leaders : candidateIds;
	return { kind: 'tie', candidateIds: [...tied].sort() };
}

/**
 * Thief flipped → Sleepyheads. Otherwise the Thief's side wins,
 * unless the flipped set includes the Scapegoat, who then wins alone.
 * A Scapegoat recruited as a follower keeps this win condition.
 */
export function decideOutcome(flippedIds: string[], seats: Seat[]): CheeseWinner {
	const flipped = new Set(flippedIds);
	if (seats.some((seat) => seat.role === 'thief' && flipped.has(seat.id))) return 'sleepyheads';
	if (seats.some((seat) => seat.role === 'scapegoat' && flipped.has(seat.id))) return 'scapegoat';
	return 'thief';
}
