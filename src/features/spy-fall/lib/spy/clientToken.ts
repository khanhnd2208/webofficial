const STORAGE_PREFIX = 'spy-game-token:';

export function getStoredPlayerToken(roomCode: string): string | null {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem(`${STORAGE_PREFIX}${roomCode.toUpperCase()}`);
}

export function storePlayerToken(roomCode: string, token: string): void {
	if (typeof window === 'undefined') return;
	localStorage.setItem(`${STORAGE_PREFIX}${roomCode.toUpperCase()}`, token);
}

export function clearPlayerToken(roomCode: string): void {
	if (typeof window === 'undefined') return;
	localStorage.removeItem(`${STORAGE_PREFIX}${roomCode.toUpperCase()}`);
}

export function getRecentPlayerName(): string | null {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem('spy-game-recent-name');
}

export function storeRecentPlayerName(name: string): void {
	if (typeof window === 'undefined') return;
	localStorage.setItem('spy-game-recent-name', name);
}
