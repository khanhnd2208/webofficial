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

export const CHEESE_PHASES = [
	'lobby',
	'deal',
	'night',
	'secret',
	'secret-result',
	'day',
	'vote',
	'reveal',
] as const;

export type CheesePhase = (typeof CHEESE_PHASES)[number];

/**
 * Round-2 tie: every tied player is flipped. The Thief among them is caught.
 * Change this one constant if a later rules pass wants a different fallback.
 */
export const TIE_FALLBACK = 'flip-all' as const;

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
	},
};

export function presetFor(playerCount: number): TablePreset {
	const preset = PRESETS[playerCount as TablePreset['playerCount']];
	if (!preset) {
		throw new Error(`Cheese Thief supports 4–8 players, received ${playerCount}`);
	}
	return preset;
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
