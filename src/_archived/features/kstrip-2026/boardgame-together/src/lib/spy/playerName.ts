import { SPY_MAX_PLAYER_NAME_LENGTH } from '@/config/spyGame';

/** Trim, collapse whitespace, and cap length for display names. */
export function normalizePlayerName(raw: string): string {
	return raw.trim().replace(/\s+/g, ' ').slice(0, SPY_MAX_PLAYER_NAME_LENGTH);
}

export function isValidPlayerName(raw: string): boolean {
	return normalizePlayerName(raw).length > 0;
}
