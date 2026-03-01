import mongoose, { Schema, type Model } from 'mongoose';

export type CommentStatus = 'pending' | 'approved' | 'hidden';

export interface IComment {
	postId: mongoose.Types.ObjectId;
	// parentId: null = top-level comment; ObjectId = direct reply to a comment
	parentId?: mongoose.Types.ObjectId | null;
	// postSlug stored for convenience (notifications, admin links)
	postSlug: string;
	postTitle?: string;
	userId: string;
	userName: string;
	userImage?: string;
	content: string;
	likes: number;
	likedBy: string[];
	// Admin moderation: pending → needs approval; approved → public; hidden → admin-only
	status: CommentStatus;
	createdAt?: Date;
	updatedAt?: Date;
}

const CommentSchema = new Schema<IComment>(
	{
		postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
		parentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null, index: true },
		postSlug: { type: String, required: true, trim: true },
		postTitle: { type: String, trim: true },
		userId: { type: String, required: true },
		userName: { type: String, required: true, trim: true },
		userImage: { type: String },
		content: { type: String, required: true, trim: true, maxlength: 2000 },
		likes: { type: Number, default: 0 },
		likedBy: { type: [String], default: [] },
		status: {
			type: String,
			enum: ['pending', 'approved', 'hidden'],
			default: 'pending',
			required: true,
			index: true,
		},
	},
	{ timestamps: true }
);

CommentSchema.index({ postId: 1, status: 1, createdAt: 1 });
CommentSchema.index({ parentId: 1, status: 1, createdAt: 1 });

const Comment: Model<IComment> =
	mongoose.models.Comment ?? mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;
