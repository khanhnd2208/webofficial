import {
	TIE_FALLBACK,
	presetFor,
	type TablePreset,
} from '@/features/cheese-thief/config/cheeseThief';

export type CheeseRole = 'thief' | 'sleepyhead' | 'scapegoat';
export type CheeseWinner = 'sleepyheads' | 'thief' | 'scapegoat';

export interface Seat {
	id: string;
	role: CheeseRole;
	/** One die, or two at a 4-player table. Values are 1–6. */
	dice: number[];
	/** Sleepyhead's chosen die at 4 players. Ignored for the Thief, who wakes at both. */
	chosenHour?: number;
}

export type SecretTaskKind = 'peek' | 'followers' | 'hunch';

export interface SecretTask {
	kind: SecretTaskKind;
	/** How many of the shared picks this task actually uses. Extra picks are camouflage. */
	count: number;
	pool: string[];
}

export interface ResolvedSecret {
	followerIds: string[];
	/** Player id → the id whose die they looked at. */
	peekByPlayer: Record<string, string>;
	/** Player id → who they think the Thief is. */
	hunchByPlayer: Record<string, string>;
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
	| { kind: 'runoff'; candidateIds: string[] }
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
): { seats: Seat[]; preset: TablePreset } {
	const preset = presetFor(ids.length);
	const order = shuffle(ids, rng);
	const useScapegoat = scapegoat && ids.length >= 6;
	const seats = order.map((id, index) => {
		const role: CheeseRole =
			index === 0 ? 'thief' : useScapegoat && index === 1 ? 'scapegoat' : 'sleepyhead';
		const dice = Array.from({ length: preset.dicePerPlayer }, () => rollDie(rng));
		return { id, role, dice };
	});
	return { seats, preset };
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

export function theftHourOf(seat: Seat, dicePerPlayer: 1 | 2): number {
	const hours = wakeHoursOf(seat, dicePerPlayer);
	return Math.min(...hours);
}

export function awakeAt(seats: Seat[], hour: number, dicePerPlayer: 1 | 2): Seat[] {
	return seats.filter((seat) => wakeHoursOf(seat, dicePerPlayer).includes(hour));
}

export function findThief(seats: Seat[]): Seat {
	const thief = seats.find((seat) => seat.role === 'thief');
	if (!thief) throw new Error('Cheese Thief deal is missing a Thief');
	return thief;
}

/** Players who see the cheese taken: awake at the Thief's first wake hour, other than the Thief. */
export function witnessesOf(seats: Seat[], preset: TablePreset): Seat[] {
	const thief = findThief(seats);
	const hour = theftHourOf(thief, preset.dicePerPlayer);
	return awakeAt(seats, hour, preset.dicePerPlayer).filter((seat) => seat.id !== thief.id);
}

/** Only a Sleepyhead awake with nobody else. The Thief never peeks. */
export function canPeek(seat: Seat, seats: Seat[], preset: TablePreset): boolean {
	if (!preset.peek || seat.role !== 'sleepyhead') return false;
	const hours = wakeHoursOf(seat, preset.dicePerPlayer);
	if (hours.length !== 1) return false;
	const hour = hours[0]!;
	return awakeAt(seats, hour, preset.dicePerPlayer).length === 1;
}

/** Same number of taps for every phone, so a glance cannot tell the jobs apart. */
export function sharedChoiceCount(preset: TablePreset): number {
	if (preset.followerMode === 'pick' && preset.followerPickCount >= 2) return 2;
	return 1;
}

export function secretTaskFor(seat: Seat, seats: Seat[], preset: TablePreset): SecretTask {
	const others = seats.filter((other) => other.id !== seat.id).map((other) => other.id);
	if (seat.role === 'thief') {
		if (preset.followerMode === 'witness') {
			const witnesses = witnessesOf(seats, preset).map((witness) => witness.id);
			if (witnesses.length > 1) return { kind: 'followers', count: 1, pool: witnesses };
		} else if (preset.followerMode === 'pick') {
			return { kind: 'followers', count: preset.followerPickCount, pool: others };
		}
		return { kind: 'hunch', count: 1, pool: others };
	}
	if (canPeek(seat, seats, preset)) return { kind: 'peek', count: 1, pool: others };
	return { kind: 'hunch', count: 1, pool: others };
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

export function resolveSecret(
	seats: Seat[],
	preset: TablePreset,
	picksByPlayer: Record<string, string[]>,
	rng: () => number,
): ResolvedSecret {
	const peekByPlayer: Record<string, string> = {};
	const hunchByPlayer: Record<string, string> = {};
	let followerIds: string[] = [];

	if (preset.followerMode === 'witness') {
		const witnesses = witnessesOf(seats, preset).map((seat) => seat.id);
		if (witnesses.length === 1) {
			followerIds = witnesses;
		} else if (witnesses.length > 1) {
			const thief = findThief(seats);
			const chosen = takeFromPool(picksByPlayer[thief.id] ?? [], witnesses, 1);
			followerIds = chosen.length === 1 ? chosen : [drawRandom(witnesses, rng)];
		}
	} else if (preset.followerMode === 'pick') {
		const thief = findThief(seats);
		const pool = seats.filter((seat) => seat.id !== thief.id).map((seat) => seat.id);
		const chosen = takeFromPool(picksByPlayer[thief.id] ?? [], pool, preset.followerPickCount);
		const remaining = pool.filter((id) => !chosen.includes(id));
		while (chosen.length < preset.followerPickCount && remaining.length > 0) {
			const next = drawRandom(remaining, rng);
			chosen.push(next);
			remaining.splice(remaining.indexOf(next), 1);
		}
		followerIds = chosen;
	}

	for (const seat of seats) {
		const task = secretTaskFor(seat, seats, preset);
		const picks = picksByPlayer[seat.id] ?? [];
		if (task.kind === 'peek') {
			const target = picks.find((id) => task.pool.includes(id));
			if (target) peekByPlayer[seat.id] = target;
		} else if (task.kind === 'hunch') {
			const target = picks.find((id) => task.pool.includes(id));
			if (target) hunchByPlayer[seat.id] = target;
		}
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
				hours: wakeHoursOf(peekSeat, preset.dicePerPlayer),
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
 * A unique leader is flipped. A tie opens a runoff among the tied players only.
 * A second tie flips that whole group (see TIE_FALLBACK).
 */
export function resolveVoteOrRunoff(
	ballots: VoteBallot[],
	isRunoff: boolean,
	candidateIds: string[],
): VoteResolution {
	const tally = tallyVotes(ballots, isRunoff ? candidateIds : undefined);
	const leaders = leadersOf(tally);
	if (leaders.length === 1) return { kind: 'flip', flippedIds: leaders };
	const tied = leaders.length > 0 ? leaders : candidateIds;
	if (!isRunoff) return { kind: 'runoff', candidateIds: [...tied].sort() };
	if (TIE_FALLBACK === 'flip-all') return { kind: 'flip', flippedIds: [...tied].sort() };
	return { kind: 'flip', flippedIds: [...tied].sort() };
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
