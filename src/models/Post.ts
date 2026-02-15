import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose';

export interface IPost {
	title: string;
	slug: string;
	content: string;
	contentFormat: 'markdown' | 'html';
	summary: string;
	category: string;
	tags: string[];
	thumbnailUrl?: string;
	isPublished: boolean;
	publishedAt?: Date;
	wordCount: number;
	views: number;
	reactions: {
		like: number;
		love: number;
		fire: number;
		clap: number;
	};
	createdAt?: Date;
	updatedAt?: Date;
}

/** Re-export from shared constants (safe for client components too) */
export { POST_CATEGORIES, type PostCategory } from '@/constants/post';

const PostSchema = new Schema<IPost>(
	{
		title: { type: String, required: true, trim: true },
		slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
		content: { type: String, required: true },
		contentFormat: { type: String, enum: ['markdown', 'html'], default: 'markdown' },
		summary: { type: String, required: true, trim: true },
		category: { type: String, default: 'Uncategorized', index: true, trim: true },
		tags: { type: [String], default: [], index: true },
		thumbnailUrl: { type: String },
		isPublished: { type: Boolean, default: false, index: true },
		publishedAt: { type: Date },
		wordCount: { type: Number, default: 0 },
		views: { type: Number, default: 0 },
		reactions: {
			like: { type: Number, default: 0 },
			love: { type: Number, default: 0 },
			fire: { type: Number, default: 0 },
			clap: { type: Number, default: 0 },
		},
	},
	{ timestamps: true }
);

PostSchema.pre('validate', function preValidate(this: HydratedDocument<IPost>) {
	// Auto-generate slug from title if missing.
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
	// Auto-calculate word count
	if (this.content) {
		this.wordCount = this.content.trim().split(/\s+/).filter(Boolean).length;
	}
	// Auto-set publishedAt when first published
	if (this.isPublished && !this.publishedAt) {
		this.publishedAt = new Date();
	}
});

const Post = (mongoose.models.Post as Model<IPost>) || mongoose.model<IPost>('Post', PostSchema);

export default Post;
