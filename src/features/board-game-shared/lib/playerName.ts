/** Longest display name any board game accepts. */
export const MAX_PLAYER_NAME_LENGTH = 24;

/** Trim, collapse whitespace, and cap length for display names. */
export function normalizePlayerName(raw: string): string {
	return raw.trim().replace(/\s+/g, ' ').slice(0, MAX_PLAYER_NAME_LENGTH);
}

export function isValidPlayerName(raw: string): boolean {
	return normalizePlayerName(raw).length > 0;
}
