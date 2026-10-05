/** Validation for Spy Fall room settings: room name, room size and spy count. */
import {
	SPY_MAX_COUNT,
	SPY_MAX_PLAYERS,
	SPY_MAX_ROOM_NAME_LENGTH,
	SPY_MIN_PLAYERS,
	isSpyCount,
	minPlayersForSpies,
	type SpyCount,
} from '@/features/spy-fall/config/spyGame';
import { GameError } from '@/features/board-game-shared/lib/gameError';

export function assertRoomName(name: string | undefined): string {
	const trimmed = name?.trim() ?? '';
	if (!trimmed) throw new GameError('ROOM_NAME_REQUIRED', 400);
	if (trimmed.length > SPY_MAX_ROOM_NAME_LENGTH) {
		throw new GameError('ROOM_NAME_TOO_LONG', 400, { max: SPY_MAX_ROOM_NAME_LENGTH });
	}
	return trimmed;
}

export function assertSpyCountFitsRoom(spyCount: SpyCount, maxPlayers: number): void {
	const min = minPlayersForSpies(spyCount);
	if (maxPlayers < min) throw new GameError('SPY_COUNT_NEEDS_ROOM', 400, { min, spies: spyCount });
}

export function parseSpyCount(value: unknown): SpyCount {
	if (!isSpyCount(value)) throw new GameError('SPY_COUNT_INVALID', 400, { max: SPY_MAX_COUNT });
	return value;
}

export function assertMaxPlayers(
	maxPlayers: unknown,
	floor = SPY_MIN_PLAYERS,
): asserts maxPlayers is number {
	const min = Math.max(SPY_MIN_PLAYERS, floor);
	if (
		typeof maxPlayers !== 'number' ||
		!Number.isInteger(maxPlayers) ||
		maxPlayers < min ||
		maxPlayers > SPY_MAX_PLAYERS
	) {
		throw new GameError('MAX_PLAYERS_INVALID', 400, { min, max: SPY_MAX_PLAYERS });
	}
}
