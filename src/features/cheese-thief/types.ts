import type { CheesePhase, FollowerKnows } from '@/features/cheese-thief/config/cheeseThief';
import type { CheeseRole, CheeseWinner, SecretCard } from '@/features/cheese-thief/lib/rules';

export type { CheesePhase, CheeseRole, CheeseWinner, SecretCard };

export interface PlayerPublicDTO {
	id: string;
	name: string;
	avatarSeed: string;
	connected: boolean;
	isHost: boolean;
	/** A seat an admin filled with a bot; it acts on its own and never becomes host. */
	isBot?: boolean;
	/** Deal only. Secret minute never reports who has already chosen. */
	hasMemorizedRole?: boolean;
	/** Reveal only. */
	role?: CheeseRole;
	wakeHours?: number[];
	/** true / false / omitted when this player had no hunch. */
	hunchCorrect?: boolean | null;
}

export interface PlayerSelfDTO {
	id: string;
	token: string;
	name: string;
	avatarSeed: string;
	isHost: boolean;
	hasMemorizedRole: boolean;
	hasSeenSecret: boolean;
	/** Deal only. */
	role?: CheeseRole;
	dice?: number[];
	wakeHours?: number[];
	/** Own vote, vote phase only. */
	voteId?: string | null;
	/** Own picks are in, secret minute only. Never shown for anyone else. */
	hasChosenSecret?: boolean;
	/** Own job, secret minute only. Same slot order on every phone. */
	secretJob?: { followers: number; peek: boolean };
	/** Own card, secret-result only. */
	secretCard?: SecretCard;
}

export interface RevealRowDTO {
	id: string;
	name: string;
	role: CheeseRole;
	wakeHours: number[];
	hunchCorrect: boolean | null;
	flipped: boolean;
	follower: boolean;
}

export interface RoomStateDTO {
	code: string;
	name: string;
	phase: CheesePhase;
	version: number;
	serverNow: string;
	isHost: boolean;
	isPublic: boolean;
	maxPlayers: number;
	scapegoatEnabled: boolean;
	/** Follower rules for this table size. Public — everyone at the table may read them. */
	followers: {
		count: number;
		knowledge: FollowerKnows;
		defaultCount: number;
		defaultKnowledge: FollowerKnows;
		max: number;
		customized: boolean;
	};
	/** Length of one night hour, set by the host in the lobby. */
	hourSeconds: number;
	playerCount: number;
	players: PlayerPublicDTO[];
	self: PlayerSelfDTO | null;
	/** ISO time the night clock started. Same for every phone; it does not say who wakes. */
	nightStartedAt?: string;
	dayStartedAt?: string;
	/** Shared tap count during the secret minute. Identical for every phone. */
	choiceCount?: number;
	/** The hour the cheese was taken. Reveal only. */
	theftHour?: number;
	voteRound?: number;
	isRunoff?: boolean;
	voteCandidateIds?: string[];
	/** How many ballots are in. Never who cast them. */
	votesCast?: number;
	flippedIds?: string[];
	followerIds?: string[];
	winner?: CheeseWinner;
	roster?: RevealRowDTO[];
}

export interface PublicRoomListItemDTO {
	code: string;
	name: string;
	playerCount: number;
	maxPlayers: number;
	status: 'waiting' | 'playing';
}

export interface CreateRoomInput {
	name: string;
	hostName: string;
	isPublic?: boolean;
	maxPlayers?: number;
	scapegoat?: boolean;
	hourSeconds?: number;
	/** `null` clears a host override and returns to the size default. */
	followerCount?: number | null;
	followerKnowledge?: FollowerKnows | null;
}

export interface UpdateSettingsInput {
	name?: string;
	isPublic?: boolean;
	maxPlayers?: number;
	scapegoat?: boolean;
	hourSeconds?: number;
	/** `null` clears a host override and returns to the size default. */
	followerCount?: number | null;
	followerKnowledge?: FollowerKnows | null;
}
