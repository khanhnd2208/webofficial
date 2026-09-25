export type Faction = 'villager' | 'werewolf' | 'solo';

export type WerewolfPhase = 'lobby' | 'dealt';

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

export interface RoleCount {
	roleId: string;
	count: number;
}

export interface WerewolfPlayerView {
	token: string;
	name: string;
	avatarSeed: string;
	connected: boolean;
	viewed: boolean;
	left: boolean;
	roleId?: string | null;
}

export interface WerewolfSelfView {
	token: string;
	name: string;
	avatarSeed: string;
	viewed: boolean;
	left: boolean;
	roleId: string | null;
}

export interface RoomStateDTO {
	code: string;
	phase: WerewolfPhase;
	version: number;
	dealRound: number;
	serverNow: string;
	isHost: boolean;
	hostName: string;
	hostConnected: boolean;
	playerCount: number;
	maxPlayers: number;
	roleCounts: RoleCount[];
	players: WerewolfPlayerView[];
	self: WerewolfSelfView | null;
}

export interface WerewolfPlayerRecord {
	token: string;
	name: string;
	avatarSeed: string;
	joinedAt: Date;
	lastSeenAt: Date;
	roleId: string | null;
	viewedAt: Date | null;
	leftAt: Date | null;
}

/** Plain room snapshot used by the DTO mapper and unit tests. */
export interface WerewolfRoomSnapshot {
	code: string;
	hostToken: string;
	hostName: string;
	hostLastSeenAt: Date;
	phase: WerewolfPhase;
	version: number;
	dealRound: number;
	roleCounts: RoleCount[];
	players: WerewolfPlayerRecord[];
}
