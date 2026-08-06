/**
 * Spy game ("AI Là Gián Điệp") — centralized configuration.
 * All magic numbers per game spec §4, §8, §15, §18, §28.
 */

// ─── Room limits ───────────────────────────────────────────────────────────────

export const SPY_MIN_PLAYERS = 4;
export const SPY_MAX_PLAYERS = 12;
export const SPY_ROOM_CODE_LENGTH = 6;
export const SPY_PLAYER_TOKEN_LENGTH = 21;
export const SPY_MAX_PLAYER_NAME_LENGTH = 24;
export const SPY_MAX_ROOM_NAME_LENGTH = 48;
export const SPY_RECENT_WORD_PAIRS = 10;

// ─── Polling & connectivity ────────────────────────────────────────────────────

export const SPY_POLL_INTERVAL_MS = 1500;
export const SPY_DISCONNECT_THRESHOLD_MS = 10_000;
export const SPY_HEARTBEAT_INTERVAL_MS = 3000;

// ─── Role distribution (spec §4) ────────────────────────────────────────────────

export interface RoleDistribution {
	civilians: number;
	spies: number;
	mrWhites: number;
	eliminationCount: number;
}

export function getRoleDistribution(
	playerCount: number,
	hideRoles = false,
): RoleDistribution {
	if (playerCount < SPY_MIN_PLAYERS || playerCount > SPY_MAX_PLAYERS) {
		throw new Error(`Player count must be ${SPY_MIN_PLAYERS}–${SPY_MAX_PLAYERS}`);
	}

	// Hidden-role mode: always 1 Spy, rest Officers, eliminate exactly 1.
	if (hideRoles) {
		return {
			civilians: playerCount - 1,
			spies: 1,
			mrWhites: 0,
			eliminationCount: 1,
		};
	}

	if (playerCount <= 6) {
		return {
			civilians: playerCount - 1,
			spies: 1,
			mrWhites: 0,
			eliminationCount: 1,
		};
	}

	return {
		civilians: playerCount - 2,
		spies: 1,
		mrWhites: 1,
		eliminationCount: 2,
	};
}

// ─── Topics & difficulty ─────────────────────────────────────────────────────────

export const SPY_TOPICS = [
	'địa điểm',
	'đồ vật',
	'nghề nghiệp',
	'hoạt động',
	'liên tưởng',
] as const;

export type SpyTopic = (typeof SPY_TOPICS)[number];

export const SPY_DIFFICULTIES = ['mixed', 'easy', 'standard', 'hard'] as const;
export type SpyDifficulty = (typeof SPY_DIFFICULTIES)[number];

export const SPY_DIFFICULTY_LABELS: Record<SpyDifficulty, string> = {
	mixed: 'Cân bằng',
	easy: 'Dễ',
	standard: 'Vừa',
	hard: 'Khó',
};
