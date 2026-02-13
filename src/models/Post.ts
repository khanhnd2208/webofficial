import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose';

export interface IPost {
	title: string;
	slug: string;
	content: string;
	summary: string;
	tags: string[];
	thumbnailUrl?: string;
	isPublished: boolean;
	createdAt?: Date;
	updatedAt?: Date;
}

const PostSchema = new Schema<IPost>(
	{
		title: { type: String, required: true, trim: true },
		slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
		content: { type: String, required: true },
		summary: { type: String, required: true, trim: true },
		tags: { type: [String], default: [], index: true },
		thumbnailUrl: { type: String },
		isPublished: { type: Boolean, default: false, index: true },
	},
	{ timestamps: true }
);

PostSchema.pre('validate', function preValidate(this: HydratedDocument<IPost>) {
	// Auto-generate slug from title if missing.
	// Keep logic lightweight here; stricter uniqueness handling is done in the service layer.
	if (!this.slug && this.title) {
		this.slug = String(this.title)
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.replace(/-{2,}/g, '-');
	}
});

const Post = (mongoose.models.Post as Model<IPost>) || mongoose.model<IPost>('Post', PostSchema);

export default Post;
