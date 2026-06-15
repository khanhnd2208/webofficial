import mongoose, { Schema, type Model } from 'mongoose';

export interface IMessageMusic {
	userId: string;
	label: string;
	url: string;
	filename: string;
	createdAt?: Date;
	updatedAt?: Date;
}

const MessageMusicSchema = new Schema<IMessageMusic>(
	{
		userId: { type: String, required: true, index: true },
		label: { type: String, required: true, trim: true },
		url: { type: String, required: true },
		filename: { type: String, required: true },
	},
	{ timestamps: true },
);

MessageMusicSchema.index({ userId: 1, createdAt: -1 });

const MessageMusic =
	(mongoose.models.MessageMusic as Model<IMessageMusic>) ??
	mongoose.model<IMessageMusic>('MessageMusic', MessageMusicSchema);

export default MessageMusic;
