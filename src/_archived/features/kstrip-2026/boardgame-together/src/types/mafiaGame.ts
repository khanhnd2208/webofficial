export type GameStatus =
	| 'HOME'
	| 'SETUP_PLAYERS'
	| 'SETUP_ORDER'
	| 'SETUP_ROLES'
	| 'SETUP_PIN'
	| 'READY_TO_ASSIGN'
	| 'ROLES_ASSIGNED'
	| 'HOST_MODE'
	| 'PLAYER_HANDOFF'
	| 'PLAYER_CONFIRM'
	| 'PLAYER_REVEAL'
	| 'PLAYER_CONFIRM_MEMORY'
	| 'DISTRIBUTION_COMPLETE'
	| 'CANCELLED';

export type ViewStatus = 'PENDING' | 'ACTIVE' | 'VIEWED';

export type Faction = 'villager' | 'werewolf' | 'solo';

export type PassDirection = 'clockwise' | 'counterclockwise';

export interface RoleDefinition {
	roleId: string;
	name: string;
	faction: Faction;
	image: string;
	emoji: string;
	gradient: string;
	shortDescription: string;
	objective: string;
	displayOrder: number;
	isEnabled: boolean;
}

export interface Player {
	id: string;
	name: string;
	seatOrder: number;
	roleId: string | null;
	viewStatus: ViewStatus;
	privateInformation: string | null;
}

export interface RoleSelection {
	roleId: string;
	count: number;
}

export interface MafiaGame {
	id: string;
	version: number;
	status: GameStatus;
	createdAt: string;
	hostPinHash: string | null;
	hostPinSalt: string | null;
	passDirection: PassDirection;
	players: Player[];
	roleSelections: RoleSelection[];
	currentPlayerId: string | null;
	distributionCompleted: boolean;
	pinAttempts: number;
	pinLockedUntil: string | null;
}

export interface MafiaGamePersisted extends MafiaGame {
	// Same shape; explicit type for storage layer
}
