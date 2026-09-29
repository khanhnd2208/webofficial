import type { RoomStateDTO as SpyRoomState } from '@/features/spy-fall/types/spyGame';
import type { RoomStateDTO as CheeseRoomState } from '@/features/cheese-thief/types';
import type { RoomStateDTO as WerewolfRoomState } from '@/features/werewolf/types';

export type TestGame = 'spy-fall' | 'cheese-thief' | 'ma-soi';
export type TestGameState = SpyRoomState | CheeseRoomState | WerewolfRoomState;

export interface CreateTestRoomInput {
	game: TestGame;
	hostName: string;
	locale?: 'vi' | 'en';
	startingSeat?: 'host' | 'player';
	playerCount?: number;
	seed?: string;
	spyCount?: 1 | 2 | 3;
	adminRole?: string;
	cheeseMode?: 'classic' | 'two-night';
	scapegoat?: boolean;
}

export interface TestRoomEnvelope {
	game: TestGame;
	state: TestGameState;
	bots: { id: string; name: string; role?: string }[];
	seed: string;
	running: boolean;
	version: number;
	clockMs: number;
	receivedAt?: number;
	log: string[];
	controlledSeatId: string;
}

export type TestCommand =
	| { kind: 'run'; running: boolean }
	| { kind: 'set-seat'; seatId: string }
	| { kind: 'start'; locale?: 'vi' | 'en' }
	| { kind: 'remember'; chosenHour?: number }
	| { kind: 'seen' }
	| { kind: 'viewed' }
	| { kind: 'lobby' }
	| { kind: 'roles'; roleCounts: { roleId: string; count: number }[] }
	| { kind: 'settings'; settings: object }
	| { kind: 'secret'; picks: string[] }
	| { kind: 'start-vote' }
	| { kind: 'step' }
	| { kind: 'tick' }
	| { kind: 'next' }
	| { kind: 'skip-time' }
	| { kind: 'reset'; sameSeed: boolean }
	| { kind: 'close' }
	| { kind: 'cheese'; present: boolean }
	| { kind: 'revote' }
	| { kind: 'vote'; playerId: string; targetId: string }
	| { kind: 'kick'; playerId: string }
	| { kind: 'rename'; name: string }
;

export interface TestCommandCursor { requestId: string; expectedVersion: number; controlledSeatId: string }
