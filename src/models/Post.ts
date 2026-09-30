import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose';

import { slugify } from '@/utils/slugify';

export interface IPost {
	title: string;
	slug: string;
	content: string;
	contentEn: string;
	contentFormat: 'markdown' | 'html';
	summary: string;
	category: string;
	tags: string[];
	/** Journal taxonomy (additive — legacy category still works). */
	pillarSlug?: string;
	contentType?: string;
	collectionSlugs?: string[];
	isFeatured?: boolean;
	thumbnailUrl?: string;
	chapterNumber?: number;
	isPinned: boolean;
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
		slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
		content: { type: String, required: true },
		contentEn: { type: String, default: '' },
		contentFormat: { type: String, enum: ['markdown', 'html'], default: 'markdown' },
		summary: { type: String, required: true, trim: true },
		category: {
			type: String,
			default: 'Uncategorized',
			trim: true,
			enum: [
				'Uncategorized',
				'Tech & Programming',
				'English Learning',
				'Tutorial',
				'Life & Thoughts',
				'Review',
				'Tips & Tricks',
			],
		},
		tags: { type: [String], default: [], index: true },
		pillarSlug: { type: String, trim: true, index: true },
		contentType: { type: String, trim: true, index: true },
		collectionSlugs: { type: [String], default: [], index: true },
		isFeatured: { type: Boolean, default: false, index: true },
		thumbnailUrl: { type: String },
		chapterNumber: { type: Number, sparse: true, unique: true, index: true },
		isPinned: { type: Boolean, default: false },
		isPublished: { type: Boolean, default: false },
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
	{ timestamps: true },
);

// Compound indexes for common query patterns
PostSchema.index({ isPublished: 1, createdAt: -1 });
PostSchema.index({ isPublished: 1, chapterNumber: 1 });
PostSchema.index({ isPublished: 1, tags: 1 });
PostSchema.index({ title: 'text', summary: 'text', tags: 'text' });

PostSchema.pre('validate', function preValidate(this: HydratedDocument<IPost>) {
	// Auto-generate slug from title if missing — reuse shared slugify util
	if (!this.slug && this.title) {
		this.slug = slugify(this.title);
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

const Post = (mongoose.models.Post as Model<IPost>) ?? mongoose.model<IPost>('Post', PostSchema);

export default Post;
