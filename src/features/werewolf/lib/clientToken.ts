const STORAGE_PREFIX = 'werewolf-token:';

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

export { getRecentPlayerName, storeRecentPlayerName } from '@/features/spy-fall/lib/spy/clientToken';
