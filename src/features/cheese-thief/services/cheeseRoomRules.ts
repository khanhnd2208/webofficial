/** Validation for Cheese Thief room settings: room name, table size, followers and hour length. */
import {
	CHEESE_HOUR_SECONDS_MAX,
	CHEESE_HOUR_SECONDS_MIN,
	CHEESE_MAX_PLAYERS,
	CHEESE_MAX_ROOM_NAME_LENGTH,
	CHEESE_MIN_PLAYERS,
	isFollowerKnows,
	isHourSeconds,
	isPlayerCountAllowed,
	playerRangeFor,
	type CheeseMode,
	type FollowerSettings,
} from '@/features/cheese-thief/config/cheeseThief';
import { GameError } from '@/features/board-game-shared/lib/gameError';

export function assertRoomName(name: string | undefined): string {
	const trimmed = name?.trim() ?? '';
	if (!trimmed) throw new GameError('ROOM_NAME_REQUIRED', 400);
	if (trimmed.length > CHEESE_MAX_ROOM_NAME_LENGTH) {
		throw new GameError('ROOM_NAME_TOO_LONG', 400, { max: CHEESE_MAX_ROOM_NAME_LENGTH });
	}
	return trimmed;
}

export function assertTableSize(size: number, mode: CheeseMode, seated: number): void {
	if (!Number.isInteger(size) || size < CHEESE_MIN_PLAYERS || size > CHEESE_MAX_PLAYERS) {
		throw new GameError('MAX_PLAYERS_INVALID', 400, {
			min: CHEESE_MIN_PLAYERS,
			max: CHEESE_MAX_PLAYERS,
		});
	}
	if (size < seated) {
		throw new GameError('MAX_PLAYERS_INVALID', 400, { min: seated, max: CHEESE_MAX_PLAYERS });
	}
	if (!isPlayerCountAllowed(size, mode)) {
		const range = playerRangeFor(mode);
		if (mode === 'two-night')
			throw new GameError('TWO_NIGHT_NEEDS_FIVE', 400, { min: range.min, max: range.max });
		throw new GameError('MAX_PLAYERS_INVALID', 400, { min: range.min, max: range.max });
	}
}

export function followerSettingsOf(game: {
	followerCount?: number;
	followerKnowledge?: string;
}): FollowerSettings {
	return {
		...(typeof game.followerCount === 'number' ? { count: game.followerCount } : {}),
		...(isFollowerKnows(game.followerKnowledge) ? { knowledge: game.followerKnowledge } : {}),
	};
}

export function assertHourSeconds(hourSeconds: unknown): asserts hourSeconds is number {
	if (!isHourSeconds(hourSeconds)) {
		throw new GameError('HOUR_SECONDS_INVALID', 400, {
			min: CHEESE_HOUR_SECONDS_MIN,
			max: CHEESE_HOUR_SECONDS_MAX,
		});
	}
}
