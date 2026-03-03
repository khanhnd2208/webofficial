import mongoose, { Schema, type Model } from 'mongoose';

import type { FeedbackMessageStatus } from '@/types/feedbackMessage';

export interface IFeedbackReply {
	role: 'user' | 'admin';
	authorId: string;
	authorName: string;
	content: string;
	createdAt: Date;
}

export interface IFeedbackMessage {
	userId: string;
	userName: string;
	userEmail: string;
	userImage?: string;
	subject: string;
	content: string;
	// Legacy single-reply fields — kept for migration compatibility
	adminReply?: string;
	adminRepliedAt?: Date;
	// Full conversation thread (includes all back-and-forth replies)
	replies: IFeedbackReply[];
	status: FeedbackMessageStatus;
	// Source page URL (auto-attached when sent from an article's feedback button)
	sourceUrl?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

const FeedbackReplySchema = new Schema<IFeedbackReply>(
	{
		role: { type: String, enum: ['user', 'admin'], required: true },
		authorId: { type: String, required: true },
		authorName: { type: String, required: true, trim: true },
		content: { type: String, required: true, trim: true, maxlength: 5000 },
		createdAt: { type: Date, default: () => new Date() },
	},
	{ _id: true }
);

const FeedbackMessageSchema = new Schema<IFeedbackMessage>(
	{
		userId: { type: String, required: true },
		userName: { type: String, required: true, trim: true },
		userEmail: { type: String, required: true, trim: true, lowercase: true },
		userImage: { type: String },
		subject: { type: String, required: true, trim: true, maxlength: 200 },
		content: { type: String, required: true, trim: true, maxlength: 5000 },
		adminReply: { type: String, trim: true, maxlength: 5000 },
		adminRepliedAt: { type: Date },
		replies: {
			type: [FeedbackReplySchema],
			default: [],
			validate: {
				validator: (v: unknown[]) => v.length <= 200,
				message: 'Replies cannot exceed 200 entries',
			},
		},
		status: {
			type: String,
			enum: ['pending', 'replied', 'closed'],
			default: 'pending',
			required: true,
		},
		sourceUrl: { type: String, trim: true },
	},
	{ timestamps: true }
);

FeedbackMessageSchema.index({ userId: 1, createdAt: -1 });
FeedbackMessageSchema.index({ status: 1, createdAt: -1 });

const FeedbackMessage =
	(mongoose.models.FeedbackMessage as Model<IFeedbackMessage>) ||
	mongoose.model<IFeedbackMessage>('FeedbackMessage', FeedbackMessageSchema);

export default FeedbackMessage;
