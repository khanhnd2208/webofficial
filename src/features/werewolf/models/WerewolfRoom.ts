import mongoose, { Schema, type Model } from 'mongoose';

import type { CardDeck, WerewolfPhase } from '@/features/werewolf/types';
import { CARD_DECKS, DEFAULT_CARD_DECK } from '@/features/werewolf/config/cardDecks';

export interface IWerewolfPlayer {
	token: string;
	name: string;
	avatarSeed: string;
	joinedAt: Date;
	lastSeenAt: Date;
	roleId: string | null;
	viewedAt: Date | null;
	leftAt: Date | null;
	isBot?: boolean;
}

export interface IWerewolfRoleCount {
	roleId: string;
	count: number;
}

export interface IWerewolfRoom {
	cardDeck?: CardDeck;
	code: string;
	hostToken: string;
	hostName: string;
	hostLastSeenAt: Date;
	phase: WerewolfPhase;
	version: number;
	dealRound: number;
	roleCounts: IWerewolfRoleCount[];
	players: IWerewolfPlayer[];
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

const PlayerSchema = new Schema<IWerewolfPlayer>(
	{
		token: { type: String, required: true },
		name: { type: String, required: true, trim: true },
		avatarSeed: { type: String, required: true },
		joinedAt: { type: Date, required: true },
		lastSeenAt: { type: Date, required: true },
		roleId: { type: String, default: null },
		viewedAt: { type: Date, default: null },
		leftAt: { type: Date, default: null },
		isBot: { type: Boolean, default: false },
	},
	{ _id: false },
);

const RoleCountSchema = new Schema<IWerewolfRoleCount>(
	{
		roleId: { type: String, required: true },
		count: { type: Number, required: true, min: 0 },
	},
	{ _id: false },
);

const WerewolfRoomSchema = new Schema<IWerewolfRoom>(
	{
		code: { type: String, required: true, unique: true, trim: true, uppercase: true },
		hostToken: { type: String, required: true },
		hostName: { type: String, required: true, trim: true },
		hostLastSeenAt: { type: Date, required: true },
		phase: { type: String, enum: ['lobby', 'dealt'], default: 'lobby' },
		cardDeck: { type: String, enum: CARD_DECKS, default: DEFAULT_CARD_DECK },
		version: { type: Number, default: 0 },
		dealRound: { type: Number, default: 0 },
		roleCounts: { type: [RoleCountSchema], default: [] },
		players: { type: [PlayerSchema], default: [] },
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
	{ timestamps: true, collection: 'werewolf_rooms' },
);

WerewolfRoomSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

if (process.env.NODE_ENV !== 'production' && mongoose.models.WerewolfRoom) {
	mongoose.deleteModel('WerewolfRoom');
}

const WerewolfRoom =
	(mongoose.models.WerewolfRoom as Model<IWerewolfRoom>) ??
	mongoose.model<IWerewolfRoom>('WerewolfRoom', WerewolfRoomSchema);

export default WerewolfRoom;
