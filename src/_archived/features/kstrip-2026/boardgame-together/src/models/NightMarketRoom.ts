import mongoose, { Schema, type Model } from 'mongoose';

import type { NightMarketGameState } from '@/types/nightMarket';

export interface INightMarketRoom {
	code: string;
	hostToken: string;
	version: number;
	game: NightMarketGameState;
	heartbeats: Record<string, Date>;
	expiresAt: Date;
	createdAt?: Date;
	updatedAt?: Date;
}

const NightMarketRoomSchema = new Schema<INightMarketRoom>(
	{
		code: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
		hostToken: { type: String, required: true },
		version: { type: Number, required: true, default: 0 },
		game: { type: Schema.Types.Mixed, required: true },
		heartbeats: { type: Schema.Types.Mixed, default: {} },
		expiresAt: { type: Date, required: true, index: { expires: 0 } },
	},
	{ timestamps: true, minimize: false },
);

const NightMarketRoom =
	(mongoose.models.NightMarketRoom as Model<INightMarketRoom>) ??
	mongoose.model<INightMarketRoom>('NightMarketRoom', NightMarketRoomSchema);

export default NightMarketRoom;
