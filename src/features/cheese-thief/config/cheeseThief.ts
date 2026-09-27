/**
 * Cheese Thief table presets and timings.
 * Follower counts live here so a rules tweak is one row, not a hunt through the service.
 */

export const CHEESE_MIN_PLAYERS = 4;
export const CHEESE_MAX_PLAYERS = 8;
export const CHEESE_ROOM_CODE_LENGTH = 6;
export const CHEESE_PLAYER_TOKEN_LENGTH = 21;
export const CHEESE_PLAYER_ID_LENGTH = 10;
export const CHEESE_MAX_PLAYER_NAME_LENGTH = 24;
export const CHEESE_MAX_ROOM_NAME_LENGTH = 48;
export const CHEESE_POLL_INTERVAL_MS = 1500;
export const CHEESE_DISCONNECT_THRESHOLD_MS = 10_000;
export const CHEESE_HOST_HANDOFF_MS = 60_000;

export const CHEESE_INTRO_MS = 8_000;
export const CHEESE_HOUR_MS = 10_000;
export const CHEESE_OUTRO_MS = 6_000;
/** Secret minute cannot end early, so a fast tap does not announce itself. */
export const CHEESE_SECRET_MIN_MS = 15_000;
/** Unfinished peeks are dropped; unfinished follower picks are filled at random. */
export const CHEESE_SECRET_MAX_MS = 60_000;

export const CHEESE_HOURS = [1, 2, 3, 4, 5, 6] as const;

export const CHEESE_MODES = ['classic', 'two-night'] as const;
export type CheeseMode = (typeof CHEESE_MODES)[number];
export type NightNumber = 1 | 2;

/** Two Nights needs a second die, which collides with the 4-player double-die rule. */
export const TWO_NIGHT_MIN_PLAYERS = 5;

/**
 * Which nights an alone Sleepyhead may peek.
 * `any-played` is the cost of the Thief waiting: more people get a look.
 * Switch this one line if a real table feels too open.
 */
export const TWO_NIGHT_PEEK_NIGHTS = 'any-played' as 'any-played' | 'theft-night';

export const CHEESE_PHASES = [
	'lobby',
	'deal',
	'night',
	'cheese-check',
	'secret',
	'secret-result',
	'day',
	'vote',
	'tie',
	'reveal',
] as const;

export type CheesePhase = (typeof CHEESE_PHASES)[number];

export function isCheeseMode(value: unknown): value is CheeseMode {
	return value === 'classic' || value === 'two-night';
}

export type FollowerMode = 'none' | 'witness' | 'pick';

export interface TablePreset {
	playerCount: 4 | 5 | 6 | 7 | 8;
	dicePerPlayer: 1 | 2;
	/** Alone Sleepyheads may look at one die. Thief never can. 4p cannot. */
	peek: boolean;
	followerMode: FollowerMode;
	/** How many followers the Thief names when mode is `pick`. */
	followerPickCount: number;
	followersKnowThief: boolean;
	thiefKnowsFollowers: boolean;
	followersKnowEachOther: boolean;
	/** Two Nights only: a Thief who waited out an alone Night 1 may peek. Off at 7–8. */
	thiefPeeksAfterWaiting: boolean;
}

/**
 * English-rules follower timing: the Thief names followers after 6 o'clock.
 * 5p is the witness rule instead — the person awake at the theft hour.
 */
export const PRESETS: Record<TablePreset['playerCount'], TablePreset> = {
	4: {
		playerCount: 4,
		dicePerPlayer: 2,
		peek: false,
		followerMode: 'none',
		followerPickCount: 0,
		followersKnowThief: false,
		thiefKnowsFollowers: false,
		followersKnowEachOther: false,
		thiefPeeksAfterWaiting: false,
	},
	5: {
		playerCount: 5,
		dicePerPlayer: 1,
		peek: true,
		followerMode: 'witness',
		followerPickCount: 1,
		followersKnowThief: true,
		thiefKnowsFollowers: true,
		followersKnowEachOther: false,
		thiefPeeksAfterWaiting: false,
	},
	6: {
		playerCount: 6,
		dicePerPlayer: 1,
		peek: true,
		followerMode: 'pick',
		followerPickCount: 1,
		followersKnowThief: true,
		thiefKnowsFollowers: true,
		followersKnowEachOther: false,
		thiefPeeksAfterWaiting: false,
	},
	7: {
		playerCount: 7,
		dicePerPlayer: 1,
		peek: true,
		followerMode: 'pick',
		followerPickCount: 2,
		followersKnowThief: false,
		thiefKnowsFollowers: true,
		followersKnowEachOther: true,
		thiefPeeksAfterWaiting: false,
	},
	8: {
		playerCount: 8,
		dicePerPlayer: 1,
		peek: true,
		followerMode: 'pick',
		followerPickCount: 2,
		followersKnowThief: true,
		thiefKnowsFollowers: true,
		followersKnowEachOther: false,
		thiefPeeksAfterWaiting: false,
	},
};

export function presetFor(playerCount: number, mode: CheeseMode = 'classic'): TablePreset {
	if (mode === 'two-night' && playerCount < TWO_NIGHT_MIN_PLAYERS) {
		throw new Error(`Two Nights needs ${TWO_NIGHT_MIN_PLAYERS}–8 players, received ${playerCount}`);
	}
	const preset = PRESETS[playerCount as TablePreset['playerCount']];
	if (!preset) {
		throw new Error(`Cheese Thief supports 4–8 players, received ${playerCount}`);
	}
	return {
		...preset,
		thiefPeeksAfterWaiting: mode === 'two-night' && playerCount <= 6,
	};
}

export function nightDurationMs(
	timing: { introMs: number; hourMs: number; outroMs: number } = {
		introMs: CHEESE_INTRO_MS,
		hourMs: CHEESE_HOUR_MS,
		outroMs: CHEESE_OUTRO_MS,
	},
): number {
	return timing.introMs + CHEESE_HOURS.length * timing.hourMs + timing.outroMs;
}
