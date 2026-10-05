import mongoose, { Schema, type Model } from 'mongoose';

import {
	CHEESE_HOUR_SECONDS_DEFAULT,
	CHEESE_HOUR_SECONDS_MAX,
	CHEESE_HOUR_SECONDS_MIN,
	CHEESE_MAX_PLAYERS,
	CHEESE_MIN_PLAYERS,
	CHEESE_PHASES,
	type FollowerKnows,
} from '@/features/cheese-thief/config/cheeseThief';
import type { CheeseRole, CheeseWinner } from '@/features/cheese-thief/lib/rules';

export interface ICheesePlayer {
	token: string;
	id: string;
	name: string;
	avatarSeed: string;
	connected: boolean;
	lastSeenAt: Date;
	role?: CheeseRole;
	dice: number[];
	hasMemorizedRole: boolean;
	/** Public ids, in tap order. Saved as a draft on every tap, so a timeout keeps a partial peek. */
	secretPicks: string[];
	/** Set when the player pressed Done. Only confirmed picks can end the secret minute early. */
	secretConfirmed: boolean;
	hasSeenSecret: boolean;
	voteId?: string;
	isBot?: boolean;
}

export interface ICheeseRoom {
	code: string;
	name: string;
	isPublic: boolean;
	maxPlayers: number;
	scapegoatEnabled: boolean;
	/** Unset means the default for `maxPlayers`. */
	followerCount?: number;
	followerKnowledge?: FollowerKnows;
	hourSeconds: number;
	hostToken: string;
	phase: (typeof CHEESE_PHASES)[number];
	voteRound: number;
	version: number;
	players: ICheesePlayer[];
	nightStartedAt?: Date;
	secretStartedAt?: Date;
	dayStartedAt?: Date;
	choiceCount: number;
	isRunoff: boolean;
	voteCandidateIds: string[];
	flippedIds: string[];
	followerIds: string[];
	peekByPlayer: Map<string, string> | Record<string, string>;
	hunchByPlayer: Map<string, string> | Record<string, string>;
	winner?: CheeseWinner;
	adminTest?: {
		ownerUserId: string;
		seed: string;
		running: boolean;
		randomState: number;
		initialConfig: Record<string, unknown>;
		log: string[];
		controlledSeatId?: string;
		hostPhaseAt?: Date;
		pausedNightElapsedMs?: number;
		pausedSecretElapsedMs?: number;
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

const CheesePlayerSchema = new Schema<ICheesePlayer>(
	{
		token: { type: String, required: true },
		id: { type: String, required: true },
		name: { type: String, required: true, trim: true },
		avatarSeed: { type: String, required: true },
		connected: { type: Boolean, default: true },
		lastSeenAt: { type: Date, default: Date.now },
		role: { type: String, enum: ['thief', 'sleepyhead', 'scapegoat'] },
		dice: { type: [Number], default: [] },
		hasMemorizedRole: { type: Boolean, default: false },
		secretPicks: { type: [String], default: [] },
		secretConfirmed: { type: Boolean, default: false },
		hasSeenSecret: { type: Boolean, default: false },
		voteId: { type: String },
		isBot: { type: Boolean, default: false },
	},
	{ _id: false, id: false },
);

const CheeseRoomSchema = new Schema<ICheeseRoom>(
	{
		code: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
		name: { type: String, required: true, trim: true },
		isPublic: { type: Boolean, default: true, index: true },
		maxPlayers: { type: Number, required: true, min: CHEESE_MIN_PLAYERS, max: CHEESE_MAX_PLAYERS },
		scapegoatEnabled: { type: Boolean, default: false },
		followerCount: { type: Number, min: 0, max: 4 },
		followerKnowledge: { type: String, enum: ['team', 'all'] },
		hourSeconds: {
			type: Number,
			default: CHEESE_HOUR_SECONDS_DEFAULT,
			min: CHEESE_HOUR_SECONDS_MIN,
			max: CHEESE_HOUR_SECONDS_MAX,
		},
		hostToken: { type: String, required: true },
		phase: { type: String, enum: CHEESE_PHASES, default: 'lobby', index: true },
		version: { type: Number, default: 0 },
		players: { type: [CheesePlayerSchema], default: [] },
		nightStartedAt: { type: Date },
		secretStartedAt: { type: Date },
		dayStartedAt: { type: Date },
		voteRound: { type: Number, default: 0 },
		choiceCount: { type: Number, default: 1 },
		isRunoff: { type: Boolean, default: false },
		voteCandidateIds: { type: [String], default: [] },
		flippedIds: { type: [String], default: [] },
		followerIds: { type: [String], default: [] },
		peekByPlayer: { type: Map, of: String, default: {} },
		hunchByPlayer: { type: Map, of: String, default: {} },
		winner: { type: String, enum: ['sleepyheads', 'thief', 'scapegoat'] },
		adminTest: {
			ownerUserId: String,
			seed: String,
			running: { type: Boolean, default: false },
			randomState: Number,
			initialConfig: { type: Schema.Types.Mixed },
			log: { type: [String], default: [] },
			controlledSeatId: String,
			hostPhaseAt: Date,
			pausedNightElapsedMs: Number,
			pausedSecretElapsedMs: Number,
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

/**
 * A two-night round left in Mongo cannot finish under one-night rules.
 * Strict mode would drop `nightNumber`, so catch it here, before casting.
 * The next load sends that room back to the lobby. Rooms expire after a day.
 */
CheeseRoomSchema.pre('init', function (raw: { phase?: string; nightNumber?: number }) {
	if (raw.phase === 'cheese-check' || raw.nightNumber === 2) {
		this.$locals.legacyTwoNight = true;
	}
});

CheeseRoomSchema.index({ isPublic: 1, phase: 1, updatedAt: -1 });
CheeseRoomSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

if (process.env.NODE_ENV !== 'production' && mongoose.models.CheeseThiefRoom) {
	mongoose.deleteModel('CheeseThiefRoom');
}

const CheeseThiefRoom =
	(mongoose.models.CheeseThiefRoom as Model<ICheeseRoom>) ??
	mongoose.model<ICheeseRoom>('CheeseThiefRoom', CheeseRoomSchema, 'cheese_thief_rooms');

export default CheeseThiefRoom;
