import type { SpyDifficulty, SpyTopic } from '@/features/spy-fall/config/spyGame';

// ─── Enums ─────────────────────────────────────────────────────────────────────

export type GamePhase =
	| 'lobby'
	| 'role-reveal'
	| 'opening'
	| 'discussion'
	| 'vote'
	| 'runoff'
	| 'mrwhite-guess'
	| 'result';

export type PlayerRole = 'civilian' | 'spy' | 'mrwhite';

export type WinningSide = 'civilian' | 'antagonist';

export type MrWhiteGuessResult = 'correct' | 'incorrect' | 'pending' | 'skipped';

// ─── Word pair ─────────────────────────────────────────────────────────────────

export interface WordPairDTO {
	civilianWord: string;
	spyWord: string;
	topic: string;
}

// ─── Player DTOs (scoped for privacy) ──────────────────────────────────────────

export interface PlayerPublicDTO {
	token: string;
	name: string;
	avatarSeed: string;
	connected: boolean;
	isReady: boolean;
	hasMemorizedRole: boolean;
	hasSpoken: boolean;
	suspicionCount: number;
	isHost: boolean;
	isEliminated: boolean;
	/** Visible during vote/runoff — ballot sealed, not who they voted for */
	voteConfirmed?: boolean;
	/** Only set on result phase for all players */
	role?: PlayerRole;
	/** Only set on result phase — votes received in primary vote tally */
	votesReceived?: number;
}

export interface PlayerSelfDTO extends PlayerPublicDTO {
	role?: PlayerRole;
	keyword?: string | null;
	teammateName?: string | null;
	publicSuspectTokens: string[];
	vote1Token?: string | null;
	vote2Token?: string | null;
	voteConfirmed: boolean;
	runoffChoices: string[];
}

// ─── Room list item ────────────────────────────────────────────────────────────

export interface PublicRoomListItemDTO {
	code: string;
	name: string;
	playerCount: number;
	maxPlayers: number;
	topic: string;
	difficulty: SpyDifficulty;
	status: 'waiting' | 'playing';
}

// ─── Runoff state ──────────────────────────────────────────────────────────────

export interface RunoffStateDTO {
	candidateTokens: string[];
	slotsRemaining: number;
}

// ─── Mr. White guess ───────────────────────────────────────────────────────────

export interface MrWhiteStateDTO {
	token: string | null;
	playerName: string | null;
	guessResult: MrWhiteGuessResult;
	canConfirm: boolean;
}

// ─── Result ────────────────────────────────────────────────────────────────────

export interface GameResultDTO {
	winningSide: WinningSide;
	eliminatedTokens: string[];
	wordsRevealed: boolean;
	civilianWord?: string;
	spyWord?: string;
	mrWhiteGuessResult: MrWhiteGuessResult;
	durationSeconds: number;
}

export interface TieBreakDebugDTO {
	step: string;
	detail: string;
	randomPick?: string[];
}

// ─── Full scoped room state ────────────────────────────────────────────────────

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
	difficulty: SpyDifficulty;
	showQuestionHints: boolean;
	/** When true: hide role identity mid-game; always 1 Spy, no Mr. White */
	hideRoles: boolean;
	/** When true: host sees tie-break debug on result */
	playtestMode: boolean;
	playerCount: number;
	players: PlayerPublicDTO[];
	self: PlayerSelfDTO | null;
	wordPair?: WordPairDTO;
	runoff?: RunoffStateDTO;
	mrWhite?: MrWhiteStateDTO;
	result?: GameResultDTO;
	/** Vote phase: how many suspects each player must pick (equals bad-side count) */
	votesRequired?: number;
	/** Discussion phase: how many suspects each player may mark (equals bad-side count) */
	suspectsRequired?: number;
	debug?: TieBreakDebugDTO[];
}

// ─── Create / join inputs ────────────────────────────────────────────────────────

export interface CreateRoomInput {
	name: string;
	isPublic?: boolean;
	maxPlayers?: number;
	topic?: SpyTopic | string;
	difficulty?: SpyDifficulty;
	showQuestionHints?: boolean;
	hideRoles?: boolean;
	playtestMode?: boolean;
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
	difficulty?: SpyDifficulty;
	showQuestionHints?: boolean;
	hideRoles?: boolean;
	playtestMode?: boolean;
}

export interface VoteInput {
	vote1Token?: string | null;
	vote2Token?: string | null;
	confirmed?: boolean;
}

export interface RunoffVoteInput {
	choices: string[];
}

export interface MrWhiteResultInput {
	guessResult: 'correct' | 'incorrect';
}

export interface RenamePlayerInput {
	name: string;
}

export interface LeaveRoomResult {
	roomClosed: boolean;
}
