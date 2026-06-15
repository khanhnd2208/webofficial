import mongoose, { Schema, type Model } from 'mongoose';

export interface IMessage {
	slug: string;
	title: string;
	recipientName: string;
	displayFont?: string;
	content: string;
	coverImageUrl?: string;
	musicTrack?: string;
	passwordHash?: string;
	createdBy: string;
	isPublished: boolean;
	viewCount: number;
	expiresAt?: Date;
	createdAt?: Date;
	updatedAt?: Date;
}

const MessageSchema = new Schema<IMessage>(
	{
		slug: { type: String, required: true, unique: true, trim: true, index: true },
		title: { type: String, required: true, trim: true },
		recipientName: { type: String, required: true, trim: true },
		displayFont: { type: String, default: 'be-vietnam-pro' },
		content: { type: String, required: true },
		coverImageUrl: { type: String },
		musicTrack: { type: String },
		passwordHash: { type: String },
		createdBy: { type: String, required: true, index: true },
		isPublished: { type: Boolean, default: false },
		viewCount: { type: Number, default: 0 },
		expiresAt: { type: Date },
	},
	{ timestamps: true },
);

MessageSchema.index({ createdBy: 1, createdAt: -1 });
MessageSchema.index({ isPublished: 1, slug: 1 });

const Message =
	(mongoose.models.Message as Model<IMessage>) ?? mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
