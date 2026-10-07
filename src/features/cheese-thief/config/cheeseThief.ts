/**
 * Cheese Thief table presets and timings.
 * Follower counts live here so a rules tweak is one row, not a hunt through the service.
 */

export const CHEESE_MIN_PLAYERS = 4;
/** Room capacity. Every table plays one night, from 4 to 12 players. */
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
/** One-tap lengths in the lobby. A saved room may still use any whole second from 8 to 30. */
export const CHEESE_HOUR_LEVELS = [
	{ id: 'fast', seconds: 8 },
	{ id: 'medium', seconds: 10 },
	{ id: 'slow', seconds: 15 },
] as const;
export const CHEESE_HOUR_SECONDS_PRESETS = CHEESE_HOUR_LEVELS.map((level) => level.seconds);
export const CHEESE_HOUR_MS = CHEESE_HOUR_SECONDS_DEFAULT * 1000;
/** "Go back to sleep" stays short; a longer hour buys more eyes-open time. */
export const CHEESE_SLEEP_MAX_MS = 4_000;

export const CHEESE_HOURS = [1, 2, 3, 4, 5, 6] as const;

/** The Scapegoat needs a table of 6 or more. */
export const SCAPEGOAT_MIN_PLAYERS = 6;

export const CHEESE_PHASES = [
	'lobby',
	'deal',
	'night',
	'secret',
	'secret-result',
	'day',
	'vote',
	'tie',
	'reveal',
] as const;

export type CheesePhase = (typeof CHEESE_PHASES)[number];

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
	/** A Sleepyhead (or Scapegoat) awake alone may look at one number. The Thief never can. 4 players cannot. */
	peek: boolean;
	followerMode: FollowerMode;
	/** How many followers the Thief names when mode is `pick`. */
	followerPickCount: number;
	followersKnowThief: boolean;
	thiefKnowsFollowers: boolean;
	followersKnowEachOther: boolean;
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

export function resolveFollowers(
	playerCount: number,
	settings?: FollowerSettings,
): ResolvedFollowers {
	const defaults = DEFAULT_FOLLOWERS[playerCount as PlayerCount] ?? {
		count: 0,
		knowledge: 'all' as const,
	};
	const max = maxFollowersFor(playerCount);
	const requested = settings?.count;
	const count =
		requested === undefined
			? Math.min(defaults.count, max)
			: Math.min(max, Math.max(0, Math.trunc(requested)));
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

export function isPlayerCountAllowed(playerCount: number): boolean {
	return (
		Number.isInteger(playerCount) &&
		playerCount >= CHEESE_MIN_PLAYERS &&
		playerCount <= CHEESE_MAX_PLAYERS
	);
}

export function presetFor(playerCount: number, followers?: FollowerSettings): TablePreset {
	if (!isPlayerCountAllowed(playerCount)) {
		throw new Error(
			`Cheese Thief needs ${CHEESE_MIN_PLAYERS}–${CHEESE_MAX_PLAYERS} players, received ${playerCount}`,
		);
	}
	const resolved = resolveFollowers(playerCount, followers);
	const count = resolved.count;
	return {
		playerCount: playerCount as PlayerCount,
		peek: playerCount > 4,
		followerMode: count > 0 ? 'pick' : 'none',
		followerPickCount: count,
		followersKnowThief: resolved.knowledge === 'all',
		thiefKnowsFollowers: count > 0,
		followersKnowEachOther: count > 1,
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
