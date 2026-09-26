/**
 * Spy Fall — room limits and round rules.
 * Each vote must catch a Spy: a miss ends the game for the Spies, and the
 * Civilians win once every Spy is caught (one vote per Spy).
 */

export const SPY_MIN_PLAYERS = 4;
export const SPY_MAX_PLAYERS = 12;
export const SPY_ROOM_CODE_LENGTH = 6;
export const SPY_PLAYER_TOKEN_LENGTH = 21;
/** Public player id. Shorter than the auth token and safe to send to the whole room. */
export const SPY_PLAYER_ID_LENGTH = 10;
export const SPY_MAX_PLAYER_NAME_LENGTH = 24;
export const SPY_MAX_ROOM_NAME_LENGTH = 48;
export const SPY_RECENT_WORD_PAIRS = 10;

export const SPY_POLL_INTERVAL_MS = 1500;
export const SPY_DISCONNECT_THRESHOLD_MS = 10_000;
/** A host this long offline hands the room to a connected player. Longer than a phone screen lock. */
export const SPY_HOST_HANDOFF_MS = 60_000;
export const SPY_HEARTBEAT_INTERVAL_MS = 3000;

export const SPY_PHASES = [
	'lobby',
	'role-reveal',
	'discussion',
	'vote',
	'reveal',
	'result',
] as const;

/** How many Spies the host can deal. */
export const SPY_COUNTS = [1, 2, 3] as const;
export type SpyCount = (typeof SPY_COUNTS)[number];
export const SPY_DEFAULT_COUNT: SpyCount = 1;
export const SPY_MAX_COUNT: SpyCount = SPY_COUNTS[SPY_COUNTS.length - 1]!;

export function isSpyCount(value: unknown): value is SpyCount {
	return SPY_COUNTS.includes(value as SpyCount);
}

/** Stored rooms predating the setting deal one Spy. */
export function normalizeSpyCount(value: unknown): SpyCount {
	return isSpyCount(value) ? value : SPY_DEFAULT_COUNT;
}

/**
 * Civilians must still outnumber the Spies left after every catch but the last,
 * so N Spies need at least 2N + 1 players (4 for one Spy, 5 for two, 7 for three).
 */
export function minPlayersForSpies(spyCount: SpyCount): number {
	return Math.max(SPY_MIN_PLAYERS, spyCount * 2 + 1);
}

export interface RoleDistribution {
	civilians: number;
	spies: number;
}

/** `spyCount` Spies, everyone else is a Civilian. */
export function getRoleDistribution(
	playerCount: number,
	spyCount: SpyCount = SPY_DEFAULT_COUNT,
): RoleDistribution {
	const min = minPlayersForSpies(spyCount);
	if (playerCount < min || playerCount > SPY_MAX_PLAYERS) {
		throw new Error(`Player count must be ${min}–${SPY_MAX_PLAYERS} for ${spyCount} spies`);
	}
	return { civilians: playerCount - spyCount, spies: spyCount };
}

export const SPY_TOPICS = [
	'món ăn',
	'đồ uống',
	'địa điểm',
	'đồ vật',
	'nghề nghiệp',
	'hoạt động',
	'công nghệ',
	'người nổi tiếng',
	'nhân vật',
	'động vật',
	'thể thao',
	'giải trí',
	'lễ hội',
	'thương hiệu',
	'khái niệm',
	'phương tiện',
	'thời trang',
	'thiên nhiên',
	'tình huống',
] as const;

export type SpyTopic = (typeof SPY_TOPICS)[number];

/**
 * Cross-topic labels. A pair can carry several; the host excludes tags to keep
 * whole flavors out of the draw (e.g. no real people, no alcohol, no horror).
 */
export const SPY_TAGS = [
	'vietnam',
	'real-people',
	'history',
	'childhood',
	'genz',
	'pop-culture',
	'anime-kpop',
	'gaming',
	'football',
	'brands',
	'nightlife',
	'romance',
	'spooky',
	'icky',
	'office',
	'school',
	'abstract',
] as const;

export type SpyTag = (typeof SPY_TAGS)[number];

/** Keeps known tags only, deduplicated, in catalog order. */
export function normalizeExcludedTags(tags: unknown): SpyTag[] {
	if (!Array.isArray(tags)) return [];
	const wanted = new Set(tags.filter((tag): tag is string => typeof tag === 'string'));
	return SPY_TAGS.filter((tag) => wanted.has(tag));
}
