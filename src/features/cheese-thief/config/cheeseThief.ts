/**
 * Cheese Thief table presets and timings.
 * Follower counts live here so a rules tweak is one row, not a hunt through the service.
 */

export const CHEESE_MIN_PLAYERS = 4;
/** Room capacity. One night and two nights both seat up to 12. Four players stay on one night. */
export const CHEESE_MAX_PLAYERS = 12;
/** Suggested size on the create-room form. The host can change it before the table fills. */
export const CHEESE_TABLE_SIZE_DEFAULT = 6;
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

/** Two nights needs a second die, which collides with the 4-player double-die rule. */
export const TWO_NIGHT_MIN_PLAYERS = 5;
export const TWO_NIGHT_MAX_PLAYERS = 12;

export function playerRangeFor(mode: CheeseMode): { min: number; max: number } {
	return mode === 'two-night'
		? { min: TWO_NIGHT_MIN_PLAYERS, max: TWO_NIGHT_MAX_PLAYERS }
		: { min: CHEESE_MIN_PLAYERS, max: CHEESE_MAX_PLAYERS };
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

export type FollowerMode = 'none' | 'pick';

/** `team`: followers learn teammates, not the Thief. `all`: they learn the Thief as well. */
export type FollowerKnows = 'team' | 'all';

/** Omitted fields mean “use the default for this table size”. */
export interface FollowerSettings {
	count?: number;
	knowledge?: FollowerKnows;
}

export interface ResolvedFollowers {
	count: number;
	knowledge: FollowerKnows;
	defaultCount: number;
	defaultKnowledge: FollowerKnows;
	max: number;
}

export type PlayerCount = 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface TablePreset {
	playerCount: PlayerCount;
	dicePerPlayer: 1 | 2;
	/** A Sleepyhead (or Scapegoat) awake alone may look at one die. The Thief never can on one night. 4p cannot. */
	peek: boolean;
	followerMode: FollowerMode;
	/** How many followers the Thief names when mode is `pick`. */
	followerPickCount: number;
	followersKnowThief: boolean;
	thiefKnowsFollowers: boolean;
	followersKnowEachOther: boolean;
	/** Two nights only: a Thief who waited out an alone Night 1 may peek. Off from 7 players. */
	thiefPeeksAfterWaiting: boolean;
}

/**
 * Defaults follow the boxed table, with two changes the host can override:
 * every follower is named by the Thief (the 5-player witness rule is gone),
 * and one night now seats up to 12. The thief side stays a minority.
 */
const DEFAULT_FOLLOWERS: Record<PlayerCount, { count: number; knowledge: FollowerKnows }> = {
	4: { count: 0, knowledge: 'all' },
	5: { count: 1, knowledge: 'all' },
	6: { count: 1, knowledge: 'all' },
	7: { count: 2, knowledge: 'team' },
	8: { count: 2, knowledge: 'all' },
	9: { count: 2, knowledge: 'all' },
	10: { count: 3, knowledge: 'all' },
	11: { count: 3, knowledge: 'all' },
	12: { count: 3, knowledge: 'all' },
};

/** Thief side stays smaller than half the table: ceil(n/2) − 2, and never negative. */
export function maxFollowersFor(playerCount: number): number {
	if (!Number.isInteger(playerCount) || playerCount < 1) return 0;
	return Math.max(0, Math.ceil(playerCount / 2) - 2);
}

export function isFollowerCountAllowed(count: number, playerCount: number): boolean {
	return Number.isInteger(count) && count >= 0 && count <= maxFollowersFor(playerCount);
}

export function isFollowerKnows(value: unknown): value is FollowerKnows {
	return value === 'team' || value === 'all';
}

export function resolveFollowers(playerCount: number, settings?: FollowerSettings): ResolvedFollowers {
	const defaults = DEFAULT_FOLLOWERS[playerCount as PlayerCount] ?? { count: 0, knowledge: 'all' as const };
	const max = maxFollowersFor(playerCount);
	const requested = settings?.count;
	const count =
		requested === undefined ? Math.min(defaults.count, max) : Math.min(max, Math.max(0, Math.trunc(requested)));
	const knowledge = isFollowerKnows(settings?.knowledge) ? settings.knowledge : defaults.knowledge;
	return {
		count,
		knowledge,
		defaultCount: defaults.count,
		defaultKnowledge: defaults.knowledge,
		max,
	};
}

/** True when the resolved table differs from the size default. Hidden while there are no followers. */
export function followersAreCustom(resolved: ResolvedFollowers): boolean {
	return (
		resolved.count !== resolved.defaultCount ||
		(resolved.count > 0 && resolved.knowledge !== resolved.defaultKnowledge)
	);
}

export function isPlayerCountAllowed(playerCount: number, mode: CheeseMode): boolean {
	const { min, max } = playerRangeFor(mode);
	return Number.isInteger(playerCount) && playerCount >= min && playerCount <= max;
}

export function presetFor(
	playerCount: number,
	mode: CheeseMode = 'classic',
	followers?: FollowerSettings,
): TablePreset {
	if (!isPlayerCountAllowed(playerCount, mode)) {
		const { min, max } = playerRangeFor(mode);
		throw new Error(
			`${mode === 'two-night' ? 'Two nights' : 'One night'} needs ${min}–${max} players, received ${playerCount}`,
		);
	}
	const resolved = resolveFollowers(playerCount, followers);
	const count = resolved.count;
	return {
		playerCount: playerCount as PlayerCount,
		dicePerPlayer: playerCount === 4 ? 2 : 1,
		peek: playerCount > 4,
		followerMode: count > 0 ? 'pick' : 'none',
		followerPickCount: count,
		followersKnowThief: resolved.knowledge === 'all',
		thiefKnowsFollowers: count > 0,
		followersKnowEachOther: count > 1,
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
