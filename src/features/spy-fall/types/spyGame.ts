import type { SpyCount, SpyTag, SpyTopic } from '@/features/spy-fall/config/spyGame';

export type GamePhase =
	| 'lobby'
	| 'role-reveal'
	| 'discussion'
	| 'vote'
	| 'reveal'
	| 'result';

export type PlayerRole = 'civilian' | 'spy';

export type WinningSide = 'civilian' | 'antagonist';

/** Why the game ended, so the result screen can explain it. */
export type GameEndReason =
	/** The votes caught every Spy. */
	| 'all-spies-caught'
	/** The vote eliminated a Civilian. */
	| 'wrong-vote'
	/** The vote eliminated nobody (a second tie, or no ballots). */
	| 'no-elimination'
	/** The last hidden Spy left the room. */
	| 'spies-gone'
	/** Players left until Civilians could no longer outvote the Spies. */
	| 'outnumbered';

export interface WordPairDTO {
	civilianWord: string;
	spyWord: string;
	topic: string;
}

export interface VoteTallyEntry {
	token: string;
	votes: number;
}

export interface EliminationLogEntry {
	round: number;
	token: string | null;
	role?: PlayerRole;
	tally: VoteTallyEntry[];
	wasRevote: boolean;
}

export interface PlayerPublicDTO {
	token: string;
	name: string;
	avatarSeed: string;
	connected: boolean;
	hasMemorizedRole: boolean;
	isHost: boolean;
	isEliminated: boolean;
	/** Set during vote: whether this player has cast a ballot. Never who they voted for. */
	hasVoted?: boolean;
	/** Visible once eliminated, and for everyone on the result screen. */
	role?: PlayerRole;
}

export interface PlayerSelfDTO extends PlayerPublicDTO {
	role?: PlayerRole;
	keyword?: string | null;
	voteToken?: string | null;
}

export interface PublicRoomListItemDTO {
	code: string;
	name: string;
	playerCount: number;
	maxPlayers: number;
	topic: string;
	status: 'waiting' | 'playing';
}

export interface GameResultDTO {
	winningSide: WinningSide;
	endReason?: GameEndReason;
	civilianWord: string;
	spyWord: string;
	eliminationLog: EliminationLogEntry[];
	durationSeconds: number;
}

export interface RoomStateDTO {
	code: string;
	name: string;
	phase: GamePhase;
	version: number;
	serverNow: string;
	isHost: boolean;
	isPublic: boolean;
	maxPlayers: number;
	topic: string;
	/** Word tags the host keeps out of the draw. */
	excludedTags: SpyTag[];
	playtestMode: boolean;
	/** How many Spies are dealt. Each one needs its own correct vote. */
	spyCount: SpyCount;
	/** When on, each player sees whether they are a Civilian or a Spy. */
	revealRoles: boolean;
	/** Spies voted out so far this game. */
	spiesCaught: number;
	round: number;
	playerCount: number;
	players: PlayerPublicDTO[];
	self: PlayerSelfDTO | null;
	firstSpeaker?: { token: string; name: string };
	voteCandidates: string[];
	isRevote: boolean;
	lastRound?: EliminationLogEntry;
	wordPair?: WordPairDTO;
	result?: GameResultDTO;
}

export interface CreateRoomInput {
	name: string;
	isPublic?: boolean;
	maxPlayers?: number;
	topic?: SpyTopic | string;
	excludedTags?: string[];
	playtestMode?: boolean;
	spyCount?: number;
	revealRoles?: boolean;
	hostName: string;
}

export interface JoinRoomInput {
	code: string;
	name: string;
	playerToken?: string;
}

export interface UpdateSettingsInput {
	name?: string;
	isPublic?: boolean;
	maxPlayers?: number;
	topic?: string;
	excludedTags?: string[];
	playtestMode?: boolean;
	spyCount?: number;
	revealRoles?: boolean;
}

export interface VoteInput {
	targetToken?: string | null;
}

export interface RenamePlayerInput {
	name: string;
}

export interface LeaveRoomResult {
	roomClosed: boolean;
}
