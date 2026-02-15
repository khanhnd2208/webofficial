import mongoose, { Schema, type Model } from 'mongoose';

export interface IComment {
	postId: mongoose.Types.ObjectId;
	userId: string;
	userName: string;
	userImage?: string;
	content: string;
	likes: number;
	likedBy: string[];
	createdAt?: Date;
	updatedAt?: Date;
}

const CommentSchema = new Schema<IComment>(
	{
		postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
		userId: { type: String, required: true },
		userName: { type: String, required: true, trim: true },
		userImage: { type: String },
		content: { type: String, required: true, trim: true, maxlength: 2000 },
		likes: { type: Number, default: 0 },
		likedBy: { type: [String], default: [] },
	},
	{ timestamps: true }
);

// Compound index — sort by likes desc, then createdAt desc
CommentSchema.index({ postId: 1, likes: -1, createdAt: -1 });

const Comment: Model<IComment> =
	mongoose.models.Comment ?? mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;
