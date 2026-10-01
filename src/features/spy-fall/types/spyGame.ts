import type { SpyCount, SpyTag, SpyTopic } from '@/features/spy-fall/config/spyGame';

export type GamePhase = 'lobby' | 'role-reveal' | 'discussion' | 'vote' | 'reveal' | 'result';

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
	id: string;
	votes: number;
}

export interface EliminationLogEntry {
	round: number;
	/** Public id of the eliminated player, or null when nobody was eliminated. */
	id: string | null;
	role?: PlayerRole;
	tally: VoteTallyEntry[];
	wasRevote: boolean;
}

export interface PlayerPublicDTO {
	id: string;
	name: string;
	avatarSeed: string;
	connected: boolean;
	hasMemorizedRole: boolean;
	isHost: boolean;
	isEliminated: boolean;
	/** A seat an admin filled with a bot; it acts on its own and never becomes host. */
	isBot?: boolean;
	/** Set during vote: whether this player has cast a ballot. Never who they voted for. */
	hasVoted?: boolean;
	/** Visible once eliminated, and for everyone on the result screen. */
	role?: PlayerRole;
}

/** A player who left after the game started. Shown on the result roster, never their auth token. */
export interface DepartedPlayerDTO {
	id: string;
	name: string;
	avatarSeed: string;
	role?: PlayerRole;
	round: number;
}

export interface PlayerSelfDTO extends PlayerPublicDTO {
	/** The viewer's own auth secret. Other players' tokens are never included in room state. */
	token: string;
	role?: PlayerRole;
	keyword?: string | null;
	/** Public id of the player this viewer voted for. */
	voteId?: string | null;
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
	/** How many Spies are dealt. Each one needs its own correct vote. */
	spyCount: SpyCount;
	/** When on, each player sees whether they are a Civilian or a Spy. */
	revealRoles: boolean;
	/** Spies voted out so far this game. */
	spiesCaught: number;
	/** Spies still in the room and not yet eliminated. */
	spiesRemaining: number;
	round: number;
	playerCount: number;
	players: PlayerPublicDTO[];
	/** Players who left mid-game. Empty in the lobby. */
	departed: DepartedPlayerDTO[];
	self: PlayerSelfDTO | null;
	firstSpeaker?: { id: string; name: string };
	/** Public ids of the players who can be voted for. */
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
	spyCount?: number;
	revealRoles?: boolean;
	hostName: string;
}

/** The phase the host's screen was showing when they asked to move on. */
export interface PhaseCursor {
	phase: GamePhase;
	round: number;
	isRevote: boolean;
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
	spyCount?: number;
	revealRoles?: boolean;
}

export interface VoteInput {
	targetId?: string | null;
}

export interface RenamePlayerInput {
	name: string;
}

export interface LeaveRoomResult {
	roomClosed: boolean;
}
