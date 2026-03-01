import mongoose, { Schema, type Model } from 'mongoose';

import type { FeedbackMessageStatus } from '@/types/feedbackMessage';

export interface IFeedbackMessage {
	userId: string;
	userName: string;
	userEmail: string;
	userImage?: string;
	subject: string;
	content: string;
	adminReply?: string;
	adminRepliedAt?: Date;
	status: FeedbackMessageStatus;
	createdAt?: Date;
	updatedAt?: Date;
}

const FeedbackMessageSchema = new Schema<IFeedbackMessage>(
	{
		userId: { type: String, required: true, index: true },
		userName: { type: String, required: true, trim: true },
		userEmail: { type: String, required: true, trim: true, lowercase: true },
		userImage: { type: String },
		subject: { type: String, required: true, trim: true, maxlength: 200 },
		content: { type: String, required: true, trim: true, maxlength: 5000 },
		adminReply: { type: String, trim: true, maxlength: 5000 },
		adminRepliedAt: { type: Date },
		status: {
			type: String,
			enum: ['pending', 'replied', 'closed'],
			default: 'pending',
			required: true,
			index: true,
		},
	},
	{ timestamps: true }
);

// Compound index for listing user's messages
FeedbackMessageSchema.index({ userId: 1, createdAt: -1 });

const FeedbackMessage =
	(mongoose.models.FeedbackMessage as Model<IFeedbackMessage>) ||
	mongoose.model<IFeedbackMessage>('FeedbackMessage', FeedbackMessageSchema);

export default FeedbackMessage;
