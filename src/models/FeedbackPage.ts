import mongoose, { Schema, type Model } from 'mongoose';

export interface IFeedbackPage {
	title: string;
	slug: string;
	content: string;
	isPublished: boolean;
	createdAt?: Date;
	updatedAt?: Date;
}

const FeedbackPageSchema = new Schema<IFeedbackPage>(
	{
		title: { type: String, required: true, trim: true, default: 'Phản hồi' },
		slug: { type: String, required: true, unique: true, default: 'feedback', lowercase: true, trim: true },
		content: { type: String, default: '' },
		isPublished: { type: Boolean, default: true },
	},
	{ timestamps: true }
);

const FeedbackPage =
	(mongoose.models.FeedbackPage as Model<IFeedbackPage>) ||
	mongoose.model<IFeedbackPage>('FeedbackPage', FeedbackPageSchema);

export default FeedbackPage;
