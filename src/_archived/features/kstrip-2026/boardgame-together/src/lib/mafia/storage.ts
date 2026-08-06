import type { MafiaGamePersisted } from '@/types/mafiaGame';

const STORAGE_KEY = 'kstrip-mafia-game';
const CURRENT_VERSION = 1;

export function loadGame(): MafiaGamePersisted | null {
	if (typeof window === 'undefined') return null;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as MafiaGamePersisted;
		if (parsed.version !== CURRENT_VERSION) return null;
		if (parsed.status === 'CANCELLED') return null;
		return parsed;
	} catch {
		return null;
	}
}

export function saveGame(game: MafiaGamePersisted): void {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...game, version: CURRENT_VERSION }));
	} catch {
		// Storage full or unavailable
	}
}

export function clearGame(): void {
	if (typeof window === 'undefined') return;
	localStorage.removeItem(STORAGE_KEY);
}

export function createNewGameId(): string {
	return `mafia-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
