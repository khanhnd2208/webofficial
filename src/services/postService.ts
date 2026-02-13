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
} from '@/types/post';
import { slugify } from '@/utils/slugify';

type PostLean = {
	_id: unknown;
	title: string;
	slug: string;
	content: string;
	summary: string;
	tags: string[];
	thumbnailUrl?: string;
	isPublished: boolean;
	createdAt?: Date;
	updatedAt?: Date;
};

function toListItemDTO(doc: PostLean): PostListItemDTO {
	const createdAt = doc.createdAt ? new Date(doc.createdAt) : new Date(0);
	return {
		id: String(doc._id),
		title: doc.title,
		slug: doc.slug,
		summary: doc.summary,
		tags: Array.isArray(doc.tags) ? doc.tags : [],
		thumbnailUrl: doc.thumbnailUrl ?? undefined,
		createdAt: createdAt.toISOString(),
	};
}

function toDetailDTO(doc: PostLean): PostDetailDTO {
	return {
		...toListItemDTO(doc),
		content: doc.content,
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
	};
}

async function getAllPostsRaw(params: {
	page: number;
	limit: number;
	tag?: string;
}): Promise<GetAllPostsResult> {
	const page = Math.max(1, Math.floor(params.page));
	const limit = Math.min(50, Math.max(1, Math.floor(params.limit)));
	const tag = params.tag?.trim();

	await dbConnect();

	const filter: Record<string, unknown> = { isPublished: true };
	if (tag) filter.tags = tag;

	const [total, items] = await Promise.all([
		Post.countDocuments(filter),
		Post.find(filter)
			.sort({ createdAt: -1 })
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
		.sort({ createdAt: -1 })
		.limit(Math.min(10, Math.max(1, params.limit)))
		.lean()) as unknown as PostLean[];

	return items.map(toListItemDTO);
}

async function ensureUniqueSlug(base: string): Promise<string> {
	const cleanedBase = base || 'post';
	let candidate = cleanedBase;

	for (let i = 0; i < 50; i += 1) {
		const exists = await Post.exists({ slug: candidate });
		if (!exists) return candidate;
		candidate = `${cleanedBase}-${i + 2}`;
	}

	// Fallback (extremely unlikely): append timestamp.
	return `${cleanedBase}-${Date.now()}`;
}

async function ensureUniqueSlugForUpdate(base: string, excludeId: string): Promise<string> {
	const cleanedBase = base || 'post';
	let candidate = cleanedBase;

	for (let i = 0; i < 50; i += 1) {
		const exists = await Post.exists({ slug: candidate, _id: { $ne: excludeId } });
		if (!exists) return candidate;
		candidate = `${cleanedBase}-${i + 2}`;
	}

	return `${cleanedBase}-${Date.now()}`;
}

export async function createPost(input: {
	title: string;
	summary: string;
	content: string;
	tags?: string[];
	thumbnailUrl?: string;
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
		tags,
		thumbnailUrl: input.thumbnailUrl ? String(input.thumbnailUrl).trim() : undefined,
		isPublished: Boolean(input.isPublished),
	});

	return toDetailDTO(created.toObject() as unknown as PostLean);
}

export async function getAdminPosts(
	pageInput: number,
	limitInput: number,
	published: 'all' | 'true' | 'false' = 'all'
): Promise<GetAdminPostsResult> {
	const page = Math.max(1, Math.floor(pageInput));
	const limit = Math.min(50, Math.max(1, Math.floor(limitInput)));

	await dbConnect();

	const filter: Record<string, unknown> = {};
	if (published === 'true') filter.isPublished = true;
	if (published === 'false') filter.isPublished = false;

	const [total, items] = await Promise.all([
		Post.countDocuments(filter),
		Post.find(filter)
			.sort({ updatedAt: -1 })
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
	if ('tags' in input) {
		const tags = Array.isArray(input.tags) ? input.tags.map((t) => String(t).trim()) : [];
		update.tags = Array.from(new Set(tags.filter(Boolean))).slice(0, 20);
	}
	if ('thumbnailUrl' in input) {
		const v = input.thumbnailUrl;
		update.thumbnailUrl = v == null || String(v).trim() === '' ? undefined : String(v).trim();
	}
	if ('isPublished' in input) update.isPublished = Boolean(input.isPublished);
	if ('slug' in input) {
		const slugBase = slugify(String(input.slug ?? ''));
		if (slugBase) update.slug = await ensureUniqueSlugForUpdate(slugBase, cleanedId);
	}

	const updated = (await Post.findByIdAndUpdate(cleanedId, update, {
		new: true,
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
		.sort({ createdAt: -1 })
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
	async (page: number, limit: number, tag?: string) => getAllPostsRaw({ page, limit, tag }),
	['posts:list'],
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
