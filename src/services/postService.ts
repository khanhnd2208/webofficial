import { unstable_cache } from 'next/cache';

import dbConnect from '@/lib/dbConnect';
import Post from '@/models/Post';
import type {
	AdminPostDetailDTO,
	AdminPostListItemDTO,
	GetAdminPostsResult,
	GetAllPostsResult,
	PostDetailDTO,
	PostListItemDTO,
	PostReactions,
} from '@/types/post';
import { slugify } from '@/utils/slugify';

type PostLean = {
	_id: unknown;
	title: string;
	slug: string;
	content: string;
	contentEn?: string;
	contentFormat?: 'markdown' | 'html';
	summary: string;
	category?: string;
	tags: string[];
	thumbnailUrl?: string;
	chapterNumber?: number;
	isPinned?: boolean;
	isPublished: boolean;
	wordCount?: number;
	views?: number;
	publishedAt?: Date;
	reactions?: {
		like?: number;
		love?: number;
		fire?: number;
		clap?: number;
	};
	createdAt?: Date;
	updatedAt?: Date;
};

const DEFAULT_REACTIONS: PostReactions = { like: 0, love: 0, fire: 0, clap: 0 };

function toReactions(r?: PostLean['reactions']): PostReactions {
	if (!r) return { ...DEFAULT_REACTIONS };
	return {
		like: r.like ?? 0,
		love: r.love ?? 0,
		fire: r.fire ?? 0,
		clap: r.clap ?? 0,
	};
}

function toListItemDTO(doc: PostLean): PostListItemDTO {
	const createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date(0);
	return {
		id: String(doc._id),
		title: doc.title,
		slug: doc.slug,
		summary: doc.summary,
		category: doc.category || 'Uncategorized',
		tags: Array.isArray(doc.tags) ? doc.tags : [],
		thumbnailUrl: doc.thumbnailUrl ?? undefined,
		chapterNumber: doc.chapterNumber ?? undefined,
		isPinned: Boolean(doc.isPinned),
		wordCount: doc.wordCount ?? 0,
		views: doc.views ?? 0,
		reactions: toReactions(doc.reactions),
		publishedAt: doc.publishedAt ? new Date(doc.publishedAt).toISOString() : undefined,
		createdAt: createdAt.toISOString(),
	};
}

function toDetailDTO(doc: PostLean): PostDetailDTO {
	return {
		...toListItemDTO(doc),
		content: doc.content,
		contentEn: doc.contentEn ?? '',
		contentFormat: doc.contentFormat ?? 'markdown',
	};
}

function toAdminListItemDTO(doc: PostLean): AdminPostListItemDTO {
	const createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date(0);
	const updatedAt = doc.updatedAt ? new Date(doc.updatedAt) : createdAt;
	return {
		...toListItemDTO(doc),
		isPublished: Boolean(doc.isPublished),
		updatedAt: updatedAt.toISOString(),
	};
}

function toAdminDetailDTO(doc: PostLean): AdminPostDetailDTO {
	return {
		...toAdminListItemDTO(doc),
		content: doc.content,
		contentEn: doc.contentEn ?? '',
		contentFormat: doc.contentFormat ?? 'markdown',
	};
}

async function getAllPostsRaw(params: {
	page: number;
	limit: number;
	tag?: string;
	category?: string;
	sort?: string;
}): Promise<GetAllPostsResult> {
	const page = Math.max(1, Math.floor(params.page));
	const limit = Math.min(50, Math.max(1, Math.floor(params.limit)));
	const tag = params.tag?.trim();
	const category = params.category?.trim();

	await dbConnect();

	const filter: Record<string, unknown> = { isPublished: true };
	if (tag) filter.tags = tag;
	if (category && category !== 'all') filter.category = category;

	// Sort options for public pages
	let sortObj: Record<string, 1 | -1> = { chapterNumber: 1, createdAt: -1 };
	switch (params.sort) {
		case 'chapter-asc': sortObj = { chapterNumber: 1, createdAt: -1 }; break;
		case 'chapter-desc': sortObj = { chapterNumber: -1, createdAt: -1 }; break;
		case 'newest': sortObj = { createdAt: -1 }; break;
		case 'oldest': sortObj = { createdAt: 1 }; break;
		case 'views': sortObj = { views: -1 }; break;
		default: break;
	}

	const [total, items] = await Promise.all([
		Post.countDocuments(filter),
		Post.find(filter)
			.select({ content: 0 })
			.sort(sortObj)
			.skip((page - 1) * limit)
			.limit(limit)
			.lean(),
	]);

	const totalPages = Math.max(1, Math.ceil(total / limit));

	return {
		items: (items as unknown as PostLean[]).map(toListItemDTO),
		page,
		limit,
		total,
		totalPages,
	};
}

async function getAllCategoriesPublicRaw(): Promise<string[]> {
	await dbConnect();
	const cats = (await Post.distinct('category', { isPublished: true })) as unknown as string[];
	return cats.filter((c) => c && c !== 'Uncategorized').map((c) => String(c)).sort((a, b) => a.localeCompare(b));
}

async function getPostBySlugRaw(slug: string): Promise<PostDetailDTO | null> {
	const normalized = slug.trim().toLowerCase();
	if (!normalized) return null;

	await dbConnect();

	const found = (await Post.findOne({ slug: normalized, isPublished: true }).lean()) as unknown as PostLean | null;
	if (!found) return null;
	return toDetailDTO(found);
}

async function getRelatedPostsRaw(params: {
	tags: string[];
	excludeSlug?: string;
	limit: number;
}): Promise<PostListItemDTO[]> {
	await dbConnect();

	const tags = Array.from(new Set(params.tags.map((t) => String(t).trim()).filter(Boolean)));
	if (tags.length === 0) return [];

	const filter: Record<string, unknown> = {
		isPublished: true,
		tags: { $in: tags },
	};
	if (params.excludeSlug) filter.slug = { $ne: params.excludeSlug };

	const items = (await Post.find(filter)
		.select({ content: 0 })
		.sort({ createdAt: -1 })
		.limit(Math.min(10, Math.max(1, params.limit)))
		.lean()) as unknown as PostLean[];

	return items.map(toListItemDTO);
}

/**
 * Find a unique slug by appending -2, -3, … if needed.
 * @param base      The base slug (will be cleaned to 'post' if empty)
 * @param excludeId Optional post ID to exclude (used during updates)
 */
async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
	const cleanedBase = base || 'post';
	const candidates = [cleanedBase, ...Array.from({ length: 49 }, (_, i) => `${cleanedBase}-${i + 2}`)];

	const filter: Record<string, unknown> = { slug: { $in: candidates } };
	if (excludeId) filter._id = { $ne: excludeId };

	const existing = await Post.find(filter, { slug: 1 }).lean();
	const taken = new Set(existing.map((d) => (d as unknown as { slug: string }).slug));

	const available = candidates.find((c) => !taken.has(c));
	if (available) return available;
	return `${cleanedBase}-${Date.now()}`;
}

export async function createPost(input: {
	title: string;
	summary: string;
	content: string;
	contentEn?: string;
	contentFormat?: 'markdown' | 'html';
	category?: string;
	tags?: string[];
	thumbnailUrl?: string;
	chapterNumber?: number;
	isPinned?: boolean;
	isPublished?: boolean;
	slug?: string;
}): Promise<PostDetailDTO> {
	await dbConnect();

	const title = String(input.title ?? '').trim();
	const summary = String(input.summary ?? '').trim();
	const content = String(input.content ?? '').trim();
	if (!title) throw new Error('Missing title');
	if (!summary) throw new Error('Missing summary');
	if (!content) throw new Error('Missing content');

	const tags = Array.from(
		new Set((input.tags ?? []).map((t) => String(t).trim()).filter(Boolean))
	).slice(0, 20);

	const slugBase = slugify(String(input.slug ?? title));
	const slug = await ensureUniqueSlug(slugBase);

	const created = await Post.create({
		title,
		slug,
		summary,
		content,
		contentEn: input.contentEn ? String(input.contentEn).trim() : '',
		contentFormat: input.contentFormat ?? 'html',
		category: input.category ? String(input.category).trim() : 'Uncategorized',
		tags,
		thumbnailUrl: input.thumbnailUrl ? String(input.thumbnailUrl).trim() : undefined,
		chapterNumber: input.chapterNumber != null ? Number(input.chapterNumber) : undefined,
		isPinned: Boolean(input.isPinned),
		isPublished: Boolean(input.isPublished),
	});

	return toDetailDTO(created.toObject() as unknown as PostLean);
}

export async function getAdminPosts(
	pageInput: number,
	limitInput: number,
	published: 'all' | 'true' | 'false' = 'all',
	opts?: {
		tag?: string;
		category?: string;
		search?: string;
		sort?: string;
		dateFrom?: string;
		dateTo?: string;
	}
): Promise<GetAdminPostsResult> {
	const page = Math.max(1, Math.floor(pageInput));
	const limit = Math.min(50, Math.max(1, Math.floor(limitInput)));

	await dbConnect();

	const filter: Record<string, unknown> = {};
	if (published === 'true') filter.isPublished = true;
	if (published === 'false') filter.isPublished = false;

	if (opts?.tag) filter.tags = opts.tag;
	if (opts?.category && opts.category !== 'all') filter.category = opts.category;
	if (opts?.search) {
		const escaped = opts.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		filter.$or = [
			{ title: { $regex: escaped, $options: 'i' } },
			{ summary: { $regex: escaped, $options: 'i' } },
			{ tags: { $regex: escaped, $options: 'i' } },
		];
	}
	if (opts?.dateFrom || opts?.dateTo) {
		const dateFilter: Record<string, Date> = {};
		if (opts.dateFrom) dateFilter.$gte = new Date(opts.dateFrom);
		if (opts.dateTo) {
			const to = new Date(opts.dateTo);
			to.setHours(23, 59, 59, 999);
			dateFilter.$lte = to;
		}
		filter.createdAt = dateFilter;
	}

	// Sort
	let sortObj: Record<string, 1 | -1> = { updatedAt: -1 };
	switch (opts?.sort) {
		case 'oldest': sortObj = { createdAt: 1 }; break;
		case 'title': sortObj = { title: 1 }; break;
		case 'views': sortObj = { views: -1 }; break;
		case 'created': sortObj = { createdAt: -1 }; break;
		default: break; // updatedAt desc
	}

	const [total, items] = await Promise.all([
		Post.countDocuments(filter),
		Post.find(filter)
			.select({ content: 0 })
			.sort(sortObj)
			.skip((page - 1) * limit)
			.limit(limit)
			.lean(),
	]);

	const totalPages = Math.max(1, Math.ceil(total / limit));

	return {
		items: (items as unknown as PostLean[]).map(toAdminListItemDTO),
		page,
		limit,
		total,
		totalPages,
	};
}

export async function getAdminPostById(id: string): Promise<AdminPostDetailDTO | null> {
	const cleaned = String(id ?? '').trim();
	if (!cleaned) return null;

	await dbConnect();

	const found = (await Post.findById(cleaned).lean()) as unknown as PostLean | null;
	if (!found) return null;
	return toAdminDetailDTO(found);
}

export async function updatePostById(
	id: string,
	input: Record<string, unknown>
): Promise<AdminPostDetailDTO> {
	const cleanedId = String(id ?? '').trim();
	if (!cleanedId) throw new Error('Missing id');

	await dbConnect();

	const update: Record<string, unknown> = {};
	if ('title' in input) update.title = String(input.title ?? '').trim();
	if ('summary' in input) update.summary = String(input.summary ?? '').trim();
	if ('content' in input) update.content = String(input.content ?? '').trim();
	if ('contentEn' in input) update.contentEn = String(input.contentEn ?? '').trim();
	if ('contentFormat' in input) {
		const fmt = String(input.contentFormat ?? 'html');
		update.contentFormat = fmt === 'markdown' ? 'markdown' : 'html';
	}
	if ('category' in input) update.category = String(input.category ?? 'Uncategorized').trim();
	if ('tags' in input) {
		const tags = Array.isArray(input.tags) ? input.tags.map((t) => String(t).trim()) : [];
		update.tags = Array.from(new Set(tags.filter(Boolean))).slice(0, 20);
	}
	if ('thumbnailUrl' in input) {
		const v = input.thumbnailUrl;
		update.thumbnailUrl = v == null || String(v).trim() === '' ? undefined : String(v).trim();
	}
	if ('chapterNumber' in input) {
		const cn = input.chapterNumber;
		update.chapterNumber = cn == null || cn === '' ? undefined : Number(cn);
	}
	if ('isPinned' in input) update.isPinned = Boolean(input.isPinned);
	if ('isPublished' in input) {
		update.isPublished = Boolean(input.isPublished);
		// Auto-set publishedAt when first published (pre-validate hook is skipped by findByIdAndUpdate)
		if (update.isPublished) {
			const existing = (await Post.findById(cleanedId).select('publishedAt isPublished').lean()) as unknown as { publishedAt?: Date; isPublished?: boolean } | null;
			if (existing && !existing.publishedAt) {
				update.publishedAt = new Date();
			}
		}
	}
	if ('slug' in input) {
		const slugBase = slugify(String(input.slug ?? ''));
		if (slugBase) update.slug = await ensureUniqueSlug(slugBase, cleanedId);
	}

	const updated = (await Post.findByIdAndUpdate(cleanedId, update, {
		returnDocument: 'after',
		runValidators: true,
	}).lean()) as unknown as PostLean | null;

	if (!updated) throw new Error('Not found');
	return toAdminDetailDTO(updated);
}

export async function deletePostById(id: string): Promise<void> {
	const cleaned = String(id ?? '').trim();
	if (!cleaned) throw new Error('Missing id');

	await dbConnect();
	await Post.findByIdAndDelete(cleaned);
}

async function getLatestPostsRaw(limit: number): Promise<PostListItemDTO[]> {
	const lim = Math.min(10, Math.max(1, Math.floor(limit)));
	await dbConnect();

	const items = (await Post.find({ isPublished: true })
		.select({ content: 0 })
		.sort({ chapterNumber: 1, createdAt: -1 })
		.limit(lim)
		.lean()) as unknown as PostLean[];

	return items.map(toListItemDTO);
}

async function getAllTagsRaw(): Promise<string[]> {
	await dbConnect();
	const tags = (await Post.distinct('tags', { isPublished: true })) as unknown as string[];
	return tags.filter(Boolean).map((t) => String(t)).sort((a, b) => a.localeCompare(b));
}

export const getAllPosts = unstable_cache(
	async (page: number, limit: number, tag?: string, category?: string, sort?: string) =>
		getAllPostsRaw({ page, limit, tag, category, sort }),
	['posts:list'],
	{ revalidate: 60 }
);

export const getAllCategories = unstable_cache(
	async () => getAllCategoriesPublicRaw(),
	['posts:categories'],
	{ revalidate: 60 }
);

export const getPostBySlug = unstable_cache(
	async (slug: string) => getPostBySlugRaw(slug),
	['posts:detail'],
	{ revalidate: 60 }
);

export const getLatestPosts = unstable_cache(
	async (limit: number) => getLatestPostsRaw(limit),
	['posts:latest'],
	{ revalidate: 60 }
);

export const getAllTags = unstable_cache(async () => getAllTagsRaw(), ['posts:tags'], { revalidate: 60 });

export const getRelatedPosts = unstable_cache(
	async (tags: string[], excludeSlug?: string, limit: number = 3) =>
		getRelatedPostsRaw({ tags, excludeSlug, limit }),
	['posts:related'],
	{ revalidate: 60 }
);

/* ──────────────────────────────────────────────────────
   Admin-only helpers (not cached — always fresh)
   ────────────────────────────────────────────────────── */

export async function getAllCategoriesAdmin(): Promise<string[]> {
	await dbConnect();
	const cats = (await Post.distinct('category')) as unknown as string[];
	return cats.filter(Boolean).map((c) => String(c)).sort((a, b) => a.localeCompare(b));
}

export async function getAllTagsAdmin(): Promise<string[]> {
	await dbConnect();
	const tags = (await Post.distinct('tags')) as unknown as string[];
	return tags.filter(Boolean).map((t) => String(t)).sort((a, b) => a.localeCompare(b));
}

export interface AdminDashboardStats {
	totalPosts: number;
	published: number;
	drafts: number;
	totalViews: number;
	totalReactions: number;
	categories: { name: string; count: number }[];
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
	await dbConnect();

	// Consolidate into 2 aggregations instead of 6 separate queries
	const [statsAgg, categoriesAgg] = await Promise.all([
		Post.aggregate([
			{
				$group: {
					_id: null,
					totalPosts: { $sum: 1 },
					published: { $sum: { $cond: ['$isPublished', 1, 0] } },
					drafts: { $sum: { $cond: ['$isPublished', 0, 1] } },
					totalViews: { $sum: { $ifNull: ['$views', 0] } },
					totalReactions: {
						$sum: {
							$add: [
								{ $ifNull: ['$reactions.like', 0] },
								{ $ifNull: ['$reactions.love', 0] },
								{ $ifNull: ['$reactions.fire', 0] },
								{ $ifNull: ['$reactions.clap', 0] },
							],
						},
					},
				},
			},
		]),
		Post.aggregate([
			{ $group: { _id: '$category', count: { $sum: 1 } } },
			{ $sort: { count: -1 } },
		]),
	]);

	const s = statsAgg[0] ?? { totalPosts: 0, published: 0, drafts: 0, totalViews: 0, totalReactions: 0 };

	return {
		totalPosts: s.totalPosts,
		published: s.published,
		drafts: s.drafts,
		totalViews: s.totalViews,
		totalReactions: s.totalReactions,
		categories: (categoriesAgg as { _id: string; count: number }[]).map((c) => ({
			name: c._id || 'Uncategorized',
			count: c.count,
		})),
	};
}
