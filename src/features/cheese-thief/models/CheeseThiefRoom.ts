import mongoose, { Schema, type Model } from 'mongoose';

import { CHEESE_PHASES } from '@/features/cheese-thief/config/cheeseThief';
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
	chosenHour?: number;
	hasMemorizedRole: boolean;
	/** Public ids, in tap order. Cleared when the secret minute resolves. */
	secretPicks: string[];
	hasSeenSecret: boolean;
	voteId?: string;
}

export interface ICheeseRoom {
	code: string;
	name: string;
	isPublic: boolean;
	maxPlayers: number;
	scapegoatEnabled: boolean;
	hostToken: string;
	phase: (typeof CHEESE_PHASES)[number];
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
		chosenHour: { type: Number },
		hasMemorizedRole: { type: Boolean, default: false },
		secretPicks: { type: [String], default: [] },
		hasSeenSecret: { type: Boolean, default: false },
		voteId: { type: String },
	},
	{ _id: false, id: false },
);

const CheeseRoomSchema = new Schema<ICheeseRoom>(
	{
		code: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
		name: { type: String, required: true, trim: true },
		isPublic: { type: Boolean, default: true, index: true },
		maxPlayers: { type: Number, required: true, min: 4, max: 8 },
		scapegoatEnabled: { type: Boolean, default: false },
		hostToken: { type: String, required: true },
		phase: { type: String, enum: CHEESE_PHASES, default: 'lobby', index: true },
		version: { type: Number, default: 0 },
		players: { type: [CheesePlayerSchema], default: [] },
		nightStartedAt: { type: Date },
		secretStartedAt: { type: Date },
		dayStartedAt: { type: Date },
		choiceCount: { type: Number, default: 1 },
		isRunoff: { type: Boolean, default: false },
		voteCandidateIds: { type: [String], default: [] },
		flippedIds: { type: [String], default: [] },
		followerIds: { type: [String], default: [] },
		peekByPlayer: { type: Map, of: String, default: {} },
		hunchByPlayer: { type: Map, of: String, default: {} },
		winner: { type: String, enum: ['sleepyheads', 'thief', 'scapegoat'] },
	},
	{ timestamps: true },
);

CheeseRoomSchema.index({ isPublic: 1, phase: 1, updatedAt: -1 });
CheeseRoomSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

if (process.env.NODE_ENV !== 'production' && mongoose.models.CheeseThiefRoom) {
	mongoose.deleteModel('CheeseThiefRoom');
}

const CheeseThiefRoom =
	(mongoose.models.CheeseThiefRoom as Model<ICheeseRoom>) ??
	mongoose.model<ICheeseRoom>('CheeseThiefRoom', CheeseRoomSchema, 'cheese_thief_rooms');

export default CheeseThiefRoom;
