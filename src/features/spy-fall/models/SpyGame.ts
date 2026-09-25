import mongoose, { Schema, type Model } from 'mongoose';

import { SPY_PHASES } from '@/features/spy-fall/config/spyGame';
import type {
	EliminationLogEntry,
	GamePhase,
	PlayerRole,
	WinningSide,
} from '@/features/spy-fall/types/spyGame';

export interface ISpyPlayer {
	token: string;
	name: string;
	avatarSeed: string;
	connected: boolean;
	lastSeenAt: Date;
	role?: PlayerRole;
	keyword?: string;
	hasMemorizedRole: boolean;
	voteToken?: string;
	isEliminated: boolean;
}

export interface ISpyWordPair {
	civilianWord: string;
	spyWord: string;
	topic: string;
}

export interface ISpyResult {
	winningSide?: WinningSide;
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
	playtestMode: boolean;
	hostToken: string;
	phase: GamePhase;
	version: number;
	round: number;
	firstSpeakerToken?: string;
	voteCandidates: string[];
	isRevote: boolean;
	eliminationLog: EliminationLogEntry[];
	startedAt?: Date;
	wordPair?: ISpyWordPair;
	recentWordPairIds: string[];
	players: ISpyPlayer[];
	eliminatedTokens: string[];
	result: ISpyResult;
	createdAt?: Date;
	updatedAt?: Date;
}

const SpyPlayerSchema = new Schema<ISpyPlayer>(
	{
		token: { type: String, required: true },
		name: { type: String, required: true, trim: true },
		avatarSeed: { type: String, required: true },
		connected: { type: Boolean, default: true },
		lastSeenAt: { type: Date, default: Date.now },
		role: { type: String, enum: ['civilian', 'spy'] },
		keyword: { type: String },
		hasMemorizedRole: { type: Boolean, default: false },
		voteToken: { type: String },
		isEliminated: { type: Boolean, default: false },
	},
	{ _id: false },
);

const SpyGameSchema = new Schema<ISpyGame>(
	{
		code: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
		name: { type: String, required: true, trim: true },
		isPublic: { type: Boolean, default: false, index: true },
		maxPlayers: { type: Number, required: true, min: 4, max: 12 },
		topic: { type: String, required: true },
		excludedTags: { type: [String], default: [] },
		playtestMode: { type: Boolean, default: false },
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
			revealedAt: Date,
			durationSeconds: Number,
		},
	},
	{ timestamps: true },
);

SpyGameSchema.index({ isPublic: 1, phase: 1, updatedAt: -1 });
// Abandoned rooms (every poll bumps updatedAt) clear themselves after a day.
SpyGameSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

const SpyGame =
	(mongoose.models.SpyGame as Model<ISpyGame>) ??
	mongoose.model<ISpyGame>('SpyGame', SpyGameSchema);

export default SpyGame;
