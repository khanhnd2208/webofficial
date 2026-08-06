import mongoose, { Schema, type Model } from 'mongoose';

import type { GamePhase, MrWhiteGuessResult, PlayerRole, WinningSide } from '@/types/spyGame';
import type { SpyDifficulty } from '@/config/spyGame';

export interface ISpyPlayer {
	token: string;
	name: string;
	avatarSeed: string;
	connected: boolean;
	lastSeenAt: Date;
	isReady: boolean;
	role?: PlayerRole;
	keyword?: string;
	teammateName?: string;
	hasMemorizedRole: boolean;
	hasSpoken: boolean;
	publicSuspectTokens: string[];
	vote1Token?: string;
	vote2Token?: string;
	voteConfirmed: boolean;
	runoffChoices: string[];
	isEliminated: boolean;
}

export interface ISpyWordPair {
	civilianWord: string;
	spyWord: string;
	topic: string;
}

export interface ISpyRunoff {
	candidateTokens: string[];
	slotsRemaining: number;
	primarySelectedTokens: string[];
	primaryVoteSnapshot: Array<{
		token: string;
		totalVotes: number;
		topSuspectVotes: number;
	}>;
}

export interface ISpyMrWhite {
	token?: string;
	guessResult: MrWhiteGuessResult;
	confirmerToken?: string;
}

export interface ISpyResult {
	winningSide?: WinningSide;
	revealedAt?: Date;
	durationSeconds?: number;
}

export interface ISpyDebug {
	tieBreakTrace: Array<{ step: string; detail: string; randomPick?: string[] }>;
	voteTotals?: Array<{ token: string; totalVotes: number; topSuspectVotes: number }>;
}

export interface ISpyGame {
	code: string;
	name: string;
	isPublic: boolean;
	maxPlayers: number;
	topic: string;
	difficulty: SpyDifficulty;
	showQuestionHints: boolean;
	hideRoles: boolean;
	playtestMode: boolean;
	hostToken: string;
	phase: GamePhase;
	version: number;
	phaseEndsAt?: Date;
	startedAt?: Date;
	wordPair?: ISpyWordPair;
	recentWordPairIds: string[];
	players: ISpyPlayer[];
	eliminatedTokens: string[];
	runoff?: ISpyRunoff;
	mrWhite: ISpyMrWhite;
	result: ISpyResult;
	wordsRevealed: boolean;
	debug?: ISpyDebug;
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
		isReady: { type: Boolean, default: false },
		role: { type: String, enum: ['civilian', 'spy', 'mrwhite'] },
		keyword: { type: String },
		teammateName: { type: String },
		hasMemorizedRole: { type: Boolean, default: false },
		hasSpoken: { type: Boolean, default: false },
		publicSuspectTokens: { type: [String], default: [] },
		vote1Token: { type: String },
		vote2Token: { type: String },
		voteConfirmed: { type: Boolean, default: false },
		runoffChoices: { type: [String], default: [] },
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
		difficulty: { type: String, enum: ['mixed', 'easy', 'standard', 'hard'], default: 'mixed' },
		showQuestionHints: { type: Boolean, default: true },
		hideRoles: { type: Boolean, default: false },
		playtestMode: { type: Boolean, default: false },
		hostToken: { type: String, required: true },
		phase: {
			type: String,
			enum: [
				'lobby',
				'role-reveal',
				'opening',
				'discussion',
				'vote',
				'runoff',
				'mrwhite-guess',
				'result',
			],
			default: 'lobby',
			index: true,
		},
		version: { type: Number, default: 0 },
		phaseEndsAt: { type: Date },
		startedAt: { type: Date },
		wordPair: {
			civilianWord: String,
			spyWord: String,
			topic: String,
		},
		recentWordPairIds: { type: [String], default: [] },
		players: { type: [SpyPlayerSchema], default: [] },
		eliminatedTokens: { type: [String], default: [] },
		runoff: {
			candidateTokens: [String],
			slotsRemaining: Number,
			primarySelectedTokens: [String],
			primaryVoteSnapshot: [
				{
					token: String,
					totalVotes: Number,
					topSuspectVotes: Number,
				},
			],
		},
		mrWhite: {
			token: String,
			guessResult: {
				type: String,
				enum: ['correct', 'incorrect', 'pending', 'skipped'],
				default: 'pending',
			},
			confirmerToken: String,
		},
		result: {
			winningSide: { type: String, enum: ['civilian', 'antagonist'] },
			revealedAt: Date,
			durationSeconds: Number,
		},
		wordsRevealed: { type: Boolean, default: false },
		debug: {
			tieBreakTrace: [
				{
					step: String,
					detail: String,
					randomPick: [String],
				},
			],
			voteTotals: [
				{
					token: String,
					totalVotes: Number,
					topSuspectVotes: Number,
				},
			],
		},
	},
	{ timestamps: true },
);

SpyGameSchema.index({ isPublic: 1, phase: 1, updatedAt: -1 });

const SpyGame =
	(mongoose.models.SpyGame as Model<ISpyGame>) ??
	mongoose.model<ISpyGame>('SpyGame', SpyGameSchema);

export default SpyGame;
