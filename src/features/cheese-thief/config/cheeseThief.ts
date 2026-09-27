/**
 * Cheese Thief table presets and timings.
 * Follower counts live here so a rules tweak is one row, not a hunt through the service.
 */

export const CHEESE_MIN_PLAYERS = 4;
/** Room capacity. Classic stops at 8 (the boxed rules); Two Nights seats up to 12. */
export const CHEESE_MAX_PLAYERS = 12;
export const CLASSIC_MAX_PLAYERS = 8;
export const CHEESE_ROOM_CODE_LENGTH = 6;
export const CHEESE_PLAYER_TOKEN_LENGTH = 21;
export const CHEESE_PLAYER_ID_LENGTH = 10;
export const CHEESE_MAX_PLAYER_NAME_LENGTH = 24;
export const CHEESE_MAX_ROOM_NAME_LENGTH = 48;
export const CHEESE_POLL_INTERVAL_MS = 1500;
export const CHEESE_DISCONNECT_THRESHOLD_MS = 10_000;
export const CHEESE_HOST_HANDOFF_MS = 60_000;
/**
 * Mid-round the host phone lies face down through the day talk and its screen locks.
 * A 60s handoff would pass the host to whoever picks up a phone first.
 */
export const CHEESE_ROUND_HOST_HANDOFF_MS = 10 * 60_000;

export const CHEESE_INTRO_MS = 8_000;
export const CHEESE_OUTRO_MS = 6_000;
/** The host picks the length of one night hour in the lobby. Every hour gets the same length. */
export const CHEESE_HOUR_SECONDS_DEFAULT = 10;
/** Below 8s the recorded wake line (≈3.5s in English) would run into "go back to sleep". */
export const CHEESE_HOUR_SECONDS_MIN = 8;
export const CHEESE_HOUR_SECONDS_MAX = 30;
export const CHEESE_HOUR_SECONDS_STEP = 1;
/** One-tap choices in the lobby; the −/+ buttons reach any second in between. */
export const CHEESE_HOUR_SECONDS_PRESETS = [8, 10, 12, 15, 20, 30] as const;
export const CHEESE_HOUR_MS = CHEESE_HOUR_SECONDS_DEFAULT * 1000;
/** "Go back to sleep" stays short; a longer hour buys more eyes-open time. */
export const CHEESE_SLEEP_MAX_MS = 4_000;
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
export const TWO_NIGHT_MAX_PLAYERS = 12;

export function playerRangeFor(mode: CheeseMode): { min: number; max: number } {
	return mode === 'two-night'
		? { min: TWO_NIGHT_MIN_PLAYERS, max: TWO_NIGHT_MAX_PLAYERS }
		: { min: CHEESE_MIN_PLAYERS, max: CLASSIC_MAX_PLAYERS };
}

/** The Scapegoat (Fall Mouse) needs a table of 6 or more, in either mode. */
export const SCAPEGOAT_MIN_PLAYERS = 6;

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

export type PlayerCount = 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface TablePreset {
	playerCount: PlayerCount;
	dicePerPlayer: 1 | 2;
	/** A Sleepyhead (or Scapegoat) awake alone may look at one die. The Thief never can in Classic. 4p cannot. */
	peek: boolean;
	followerMode: FollowerMode;
	/** How many followers the Thief names when mode is `pick`. */
	followerPickCount: number;
	followersKnowThief: boolean;
	thiefKnowsFollowers: boolean;
	followersKnowEachOther: boolean;
	/** Two Nights only: a Thief who waited out an alone Night 1 may peek. Off from 7 players. */
	thiefPeeksAfterWaiting: boolean;
}

function pickPreset(playerCount: PlayerCount, followerPickCount: number, knowledge: 'all' | 'followers-only'): TablePreset {
	return {
		playerCount,
		dicePerPlayer: 1,
		peek: true,
		followerMode: 'pick',
		followerPickCount,
		followersKnowThief: knowledge === 'all',
		thiefKnowsFollowers: true,
		followersKnowEachOther: followerPickCount > 1,
		thiefPeeksAfterWaiting: false,
	};
}

/**
 * 4–8 follow the English rulebook: the Thief names followers after 6 o'clock,
 * except 5p, where the person awake at the theft hour becomes the follower.
 * 6p: Thief and follower see each other. 7p: the two followers see each other, not the Thief.
 * 8p: the Thief and both followers open their eyes together, so all three know each other.
 */
export const PRESETS: Record<4 | 5 | 6 | 7 | 8, TablePreset> = {
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
	6: pickPreset(6, 1, 'all'),
	7: pickPreset(7, 2, 'followers-only'),
	8: pickPreset(8, 2, 'all'),
};

/**
 * Two Nights only. The box stops at 8, so these extend the 8-player rule:
 * the Thief names followers, and Thief and followers all know each other.
 * About a third of the table sides with the Thief.
 */
export const LARGE_TABLE_PRESETS: Record<9 | 10 | 11 | 12, TablePreset> = {
	9: pickPreset(9, 2, 'all'),
	10: pickPreset(10, 3, 'all'),
	11: pickPreset(11, 3, 'all'),
	12: pickPreset(12, 3, 'all'),
};

export function isPlayerCountAllowed(playerCount: number, mode: CheeseMode): boolean {
	const { min, max } = playerRangeFor(mode);
	return Number.isInteger(playerCount) && playerCount >= min && playerCount <= max;
}

export function presetFor(playerCount: number, mode: CheeseMode = 'classic'): TablePreset {
	if (!isPlayerCountAllowed(playerCount, mode)) {
		const { min, max } = playerRangeFor(mode);
		throw new Error(`${mode === 'two-night' ? 'Two Nights' : 'Classic'} needs ${min}–${max} players, received ${playerCount}`);
	}
	const preset =
		PRESETS[playerCount as keyof typeof PRESETS] ?? LARGE_TABLE_PRESETS[playerCount as keyof typeof LARGE_TABLE_PRESETS];
	return {
		...preset,
		thiefPeeksAfterWaiting: mode === 'two-night' && playerCount <= 6,
	};
}

export function isHourSeconds(value: unknown): value is number {
	return (
		typeof value === 'number' &&
		Number.isInteger(value) &&
		value >= CHEESE_HOUR_SECONDS_MIN &&
		value <= CHEESE_HOUR_SECONDS_MAX
	);
}

export function nightTiming(hourSeconds: number = CHEESE_HOUR_SECONDS_DEFAULT): {
	introMs: number;
	hourMs: number;
	outroMs: number;
} {
	const seconds = isHourSeconds(hourSeconds) ? hourSeconds : CHEESE_HOUR_SECONDS_DEFAULT;
	return { introMs: CHEESE_INTRO_MS, hourMs: seconds * 1000, outroMs: CHEESE_OUTRO_MS };
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
