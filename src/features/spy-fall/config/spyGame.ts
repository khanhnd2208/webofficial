/**
 * Spy Fall — room limits and round rules.
 * One rule set: hidden roles, eliminate one player per round.
 */

export const SPY_MIN_PLAYERS = 4;
export const SPY_MAX_PLAYERS = 12;
export const SPY_ROOM_CODE_LENGTH = 6;
export const SPY_PLAYER_TOKEN_LENGTH = 21;
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

export interface RoleDistribution {
	civilians: number;
	spies: number;
}

/** One Spy, everyone else is a Civilian. */
export function getRoleDistribution(playerCount: number): RoleDistribution {
	if (playerCount < SPY_MIN_PLAYERS || playerCount > SPY_MAX_PLAYERS) {
		throw new Error(`Player count must be ${SPY_MIN_PLAYERS}–${SPY_MAX_PLAYERS}`);
	}
	return { civilians: playerCount - 1, spies: 1 };
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
