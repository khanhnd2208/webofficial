import mongoose, { Schema, type Model } from 'mongoose';

import { SPY_COUNTS, SPY_DEFAULT_COUNT, SPY_PHASES } from '@/features/spy-fall/config/spyGame';
import type {
	GameEndReason,
	GamePhase,
	PlayerRole,
	WinningSide,
} from '@/features/spy-fall/types/spyGame';

export interface ISpyPlayer {
	/** Auth secret. Never copied into a room-state DTO except onto the viewer's own `self`. */
	token: string;
	/** Public id sent to every client. Distinct from `token`. */
	id: string;
	name: string;
	avatarSeed: string;
	connected: boolean;
	lastSeenAt: Date;
	role?: PlayerRole;
	keyword?: string;
	hasMemorizedRole: boolean;
	/** Auth token of the player this person voted for. Mapped to a public id in the DTO. */
	voteToken?: string;
	isEliminated: boolean;
	isBot?: boolean;
}

/** Stored ballot row. `token` is an auth token; the DTO replaces it with a public id. */
export interface ISpyVoteTally {
	token: string;
	votes: number;
}

export interface ISpyElimination {
	round: number;
	token: string | null;
	role?: PlayerRole;
	tally: ISpyVoteTally[];
	wasRevote: boolean;
}

/** Someone who left after the deal. `token` stays in the database so logs can still be mapped to `id`. */
export interface ISpyDeparted {
	token: string;
	id: string;
	name: string;
	avatarSeed: string;
	role?: PlayerRole;
	round: number;
}

export interface ISpyWordPair {
	civilianWord: string;
	spyWord: string;
	topic: string;
}

export interface ISpyResult {
	winningSide?: WinningSide;
	endReason?: GameEndReason;
	revealedAt?: Date;
	durationSeconds?: number;
}

export interface ISpyGame {
	code: string;
	name: string;
	isPublic: boolean;
	maxPlayers: number;
	topic: string;
	excludedTags: string[];
	spyCount: number;
	revealRoles: boolean;
	hostToken: string;
	phase: GamePhase;
	version: number;
	round: number;
	firstSpeakerToken?: string;
	voteCandidates: string[];
	isRevote: boolean;
	eliminationLog: ISpyElimination[];
	departed: ISpyDeparted[];
	startedAt?: Date;
	wordPair?: ISpyWordPair;
	recentWordPairIds: string[];
	players: ISpyPlayer[];
	eliminatedTokens: string[];
	result: ISpyResult;
	adminTest?: {
		ownerUserId: string;
		seed: string;
		running: boolean;
		randomState: number;
		initialConfig: Record<string, unknown>;
		log: string[];
		controlledSeatId?: string;
		hostPhaseAt?: Date;
		lastTickAt?: Date;
		clockMs?: number;
		commandVersion?: number;
		requestIds?: string[];
		lockId?: string;
		lockUntil?: Date;
	};
	createdAt?: Date;
	updatedAt?: Date;
}

const SpyPlayerSchema = new Schema<ISpyPlayer>(
	{
		token: { type: String, required: true },
		id: { type: String, required: true },
		name: { type: String, required: true, trim: true },
		avatarSeed: { type: String, required: true },
		connected: { type: Boolean, default: true },
		lastSeenAt: { type: Date, default: Date.now },
		role: { type: String, enum: ['civilian', 'spy'] },
		keyword: { type: String },
		hasMemorizedRole: { type: Boolean, default: false },
		voteToken: { type: String },
		isEliminated: { type: Boolean, default: false },
		isBot: { type: Boolean, default: false },
	},
	// `id: false` turns off Mongoose's virtual so the public `id` path is the real field.
	{ _id: false, id: false },
);

const SpyGameSchema = new Schema<ISpyGame>(
	{
		code: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
		name: { type: String, required: true, trim: true },
		isPublic: { type: Boolean, default: false, index: true },
		maxPlayers: { type: Number, required: true, min: 4, max: 12 },
		topic: { type: String, required: true },
		excludedTags: { type: [String], default: [] },
		spyCount: { type: Number, enum: SPY_COUNTS, default: SPY_DEFAULT_COUNT },
		revealRoles: { type: Boolean, default: false },
		hostToken: { type: String, required: true },
		phase: { type: String, enum: SPY_PHASES, default: 'lobby', index: true },
		version: { type: Number, default: 0 },
		round: { type: Number, default: 1 },
		firstSpeakerToken: { type: String },
		voteCandidates: { type: [String], default: [] },
		isRevote: { type: Boolean, default: false },
		eliminationLog: {
			type: [
				{
					round: Number,
					token: { type: String, default: null },
					role: { type: String, enum: ['civilian', 'spy'] },
					tally: [{ token: String, votes: Number }],
					wasRevote: Boolean,
				},
			],
			default: [],
		},
		departed: {
			type: [
				{
					token: { type: String, required: true },
					id: { type: String, required: true },
					name: { type: String, required: true },
					avatarSeed: { type: String, required: true },
					role: { type: String, enum: ['civilian', 'spy'] },
					round: { type: Number, required: true },
				},
			],
			default: [],
		},
		startedAt: { type: Date },
		wordPair: {
			civilianWord: String,
			spyWord: String,
			topic: String,
		},
		recentWordPairIds: { type: [String], default: [] },
		players: { type: [SpyPlayerSchema], default: [] },
		eliminatedTokens: { type: [String], default: [] },
		result: {
			winningSide: { type: String, enum: ['civilian', 'antagonist'] },
			endReason: {
				type: String,
				enum: ['all-spies-caught', 'wrong-vote', 'no-elimination', 'spies-gone', 'outnumbered'],
			},
			revealedAt: Date,
			durationSeconds: Number,
		},
		adminTest: {
			ownerUserId: String,
			seed: String,
			running: { type: Boolean, default: false },
			randomState: Number,
			initialConfig: { type: Schema.Types.Mixed },
			log: { type: [String], default: [] },
			controlledSeatId: String,
			hostPhaseAt: Date,
			lastTickAt: Date,
			clockMs: Number,
			commandVersion: Number,
			requestIds: [String],
			lockId: String,
			lockUntil: Date,
		},
	},
	{ timestamps: true },
);

SpyGameSchema.index({ isPublic: 1, phase: 1, updatedAt: -1 });
// Abandoned rooms (every poll bumps updatedAt) clear themselves after a day.
SpyGameSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

// A long-running dev server keeps the first compiled model. Drop it so schema
// changes (like the public player id) apply without restarting the process.
if (process.env.NODE_ENV !== 'production' && mongoose.models.SpyGame) {
	mongoose.deleteModel('SpyGame');
}

const SpyGame =
	(mongoose.models.SpyGame as Model<ISpyGame>) ??
	mongoose.model<ISpyGame>('SpyGame', SpyGameSchema);

export default SpyGame;
