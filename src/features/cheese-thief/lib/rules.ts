import {
	SCAPEGOAT_MIN_PLAYERS,
	TWO_NIGHT_PEEK_NIGHTS,
	presetFor,
	type CheeseMode,
	type FollowerSettings,
	type NightNumber,
	type TablePreset,
} from '@/features/cheese-thief/config/cheeseThief';

export type CheeseRole = 'thief' | 'sleepyhead' | 'scapegoat';
export type CheeseWinner = 'sleepyheads' | 'thief' | 'scapegoat';

export interface Seat {
	id: string;
	role: CheeseRole;
	/** One die, or two at a 4-player table. Values are 1–6. Night 1. */
	dice: number[];
	/** Night 2 die. Two nights only. */
	dice2?: number[];
	/** Sleepyhead's chosen die at 4 players. Ignored for the Thief, who wakes at both. */
	chosenHour?: number;
}

export interface NightContext {
	mode: CheeseMode;
	theftNight: NightNumber;
}

export const CLASSIC_NIGHT: NightContext = { mode: 'classic', theftNight: 1 };

export interface ResolvedSecret {
	followerIds: string[];
	/** Player id → the id whose die they looked at. */
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
	peek: { name: string; hours: number[]; night?: NightNumber } | null;
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

function uniqueSorted(hours: number[]): number[] {
	return [...new Set(hours)].sort((a, b) => a - b);
}

export function deal(
	ids: string[],
	scapegoat: boolean,
	rng: () => number,
	mode: CheeseMode = 'classic',
	followers?: FollowerSettings,
): { seats: Seat[]; preset: TablePreset } {
	const preset = presetFor(ids.length, mode, followers);
	const order = shuffle(ids, rng);
	const useScapegoat = scapegoat && ids.length >= SCAPEGOAT_MIN_PLAYERS;
	const seats = order.map((id, index) => {
		const role: CheeseRole =
			index === 0 ? 'thief' : useScapegoat && index === 1 ? 'scapegoat' : 'sleepyhead';
		const dice = Array.from({ length: preset.dicePerPlayer }, () => rollDie(rng));
		const dice2 = mode === 'two-night' ? [rollDie(rng)] : undefined;
		return { id, role, dice, ...(dice2 ? { dice2 } : {}) };
	});
	return { seats, preset };
}

export function playedNights(theftNight: NightNumber): NightNumber[] {
	return theftNight === 2 ? [1, 2] : [1];
}

export function hoursInNight(seat: Seat, night: NightNumber, dicePerPlayer: 1 | 2): number[] {
	if (night === 2) return seat.dice2?.[0] === undefined ? [] : [seat.dice2[0]];
	return wakeHoursOf(seat, dicePerPlayer);
}

export function wakeHoursOf(seat: Seat, dicePerPlayer: 1 | 2): number[] {
	if (dicePerPlayer === 2 && seat.role === 'thief') return uniqueSorted(seat.dice);
	if (dicePerPlayer === 2) {
		const chosen =
			seat.chosenHour !== undefined && seat.dice.includes(seat.chosenHour)
				? seat.chosenHour
				: seat.dice[0];
		return chosen === undefined ? [] : [chosen];
	}
	return seat.dice[0] === undefined ? [] : [seat.dice[0]];
}

/**
 * At 4 players the Thief wakes at both hours but takes the cheese at the one they chose.
 * Always taking the earlier die would push the theft toward 1 o'clock (min of 2d6).
 */
export function theftHourOf(seat: Seat, dicePerPlayer: 1 | 2, night: NightNumber = 1): number {
	const hours = hoursInNight(seat, night, dicePerPlayer);
	if (night === 1 && dicePerPlayer === 2 && seat.chosenHour !== undefined && hours.includes(seat.chosenHour)) {
		return seat.chosenHour;
	}
	return Math.min(...hours);
}

export function awakeAt(seats: Seat[], hour: number, dicePerPlayer: 1 | 2, night: NightNumber = 1): Seat[] {
	return seats.filter((seat) => hoursInNight(seat, night, dicePerPlayer).includes(hour));
}

export function findThief(seats: Seat[]): Seat {
	const thief = seats.find((seat) => seat.role === 'thief');
	if (!thief) throw new Error('Cheese Thief deal is missing a Thief');
	return thief;
}

export function wasAlone(seat: Seat, seats: Seat[], preset: TablePreset, night: NightNumber): boolean {
	const hours = hoursInNight(seat, night, preset.dicePerPlayer);
	if (hours.length !== 1) return false;
	return awakeAt(seats, hours[0]!, preset.dicePerPlayer, night).length === 1;
}

/**
 * One night: a Sleepyhead awake with nobody else. The Thief never peeks.
 * The Scapegoat plays as a Sleepyhead does, so it peeks too.
 * Two nights: a Sleepyhead alone on a played night, or a Thief who waited out an alone Night 1 (5–6 players).
 */
export function canPeek(seat: Seat, seats: Seat[], preset: TablePreset, ctx: NightContext = CLASSIC_NIGHT): boolean {
	if (!preset.peek) return false;
	const sleeper = seat.role !== 'thief';
	if (ctx.mode === 'classic') return sleeper && wasAlone(seat, seats, preset, 1);
	const nights: NightNumber[] = TWO_NIGHT_PEEK_NIGHTS === 'theft-night' ? [ctx.theftNight] : playedNights(ctx.theftNight);
	if (sleeper) return nights.some((night) => wasAlone(seat, seats, preset, night));
	if (seat.role === 'thief') {
		return preset.thiefPeeksAfterWaiting && ctx.theftNight === 2 && wasAlone(seat, seats, preset, 1);
	}
	return false;
}

/**
 * Same number of taps for every phone, fixed by the table settings alone.
 * Two nights never drops below 2, so the count cannot reveal whether the Thief waited.
 * It grows with the number of followers the Thief names.
 */
export function sharedChoiceCount(preset: TablePreset, mode: CheeseMode = 'classic'): number {
	const followerSlots = preset.followerMode === 'pick' ? preset.followerPickCount : 1;
	if (mode === 'two-night') return Math.max(2, followerSlots + (preset.thiefPeeksAfterWaiting ? 1 : 0));
	return Math.max(1, followerSlots);
}

export function secretJobFor(
	seat: Seat,
	seats: Seat[],
	preset: TablePreset,
	ctx: NightContext = CLASSIC_NIGHT,
): SecretJob {
	const others = seats.filter((other) => other.id !== seat.id).map((other) => other.id);
	let followers: SecretJob['followers'] = null;
	if (seat.role === 'thief' && preset.followerMode === 'pick') {
		followers = { count: preset.followerPickCount, pool: others };
	}
	return { followers, peek: canPeek(seat, seats, preset, ctx) };
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

function slotsOf(picks: string[], job: SecretJob): { followerPicks: string[]; peekPick?: string; rest: string[] } {
	let cursor = 0;
	const count = job.followers?.count ?? 0;
	const followerPicks = picks.slice(cursor, cursor + count);
	cursor += count;
	const peekPick = job.peek ? picks[cursor] : undefined;
	if (job.peek) cursor += 1;
	return { followerPicks, ...(peekPick !== undefined ? { peekPick } : {}), rest: picks.slice(cursor) };
}

export function resolveSecret(
	seats: Seat[],
	preset: TablePreset,
	picksByPlayer: Record<string, string[]>,
	rng: () => number,
	ctx: NightContext = CLASSIC_NIGHT,
): ResolvedSecret {
	const peekByPlayer: Record<string, string> = {};
	const hunchByPlayer: Record<string, string> = {};
	let followerIds: string[] = [];
	const thief = findThief(seats);
	const thiefSlots = slotsOf(picksByPlayer[thief.id] ?? [], secretJobFor(thief, seats, preset, ctx));

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
		const job = secretJobFor(seat, seats, preset, ctx);
		const others = new Set(seats.filter((other) => other.id !== seat.id).map((other) => other.id));
		const slots = seat.id === thief.id ? thiefSlots : slotsOf(picksByPlayer[seat.id] ?? [], job);
		if (job.peek && slots.peekPick && others.has(slots.peekPick)) peekByPlayer[seat.id] = slots.peekPick;
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
	ctx: NightContext = CLASSIC_NIGHT,
): SecretCard {
	const seat = seats.find((item) => item.id === playerId);
	const peekTarget = resolved.peekByPlayer[playerId];
	const peekSeat = peekTarget ? seats.find((item) => item.id === peekTarget) : undefined;
	const peek = peekSeat
		? {
				name: names.get(peekSeat.id) ?? peekSeat.id,
				hours: hoursInNight(peekSeat, ctx.theftNight, preset.dicePerPlayer),
				...(ctx.mode === 'two-night' ? { night: ctx.theftNight } : {}),
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
					? resolved.followerIds
							.filter((id) => id !== playerId)
							.map((id) => names.get(id) ?? id)
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
