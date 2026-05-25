import { revalidatePath } from 'next/cache';
import { type NextRequest } from 'next/server';

import { withAdmin, withErrorHandling, apiSuccess } from '@/lib/apiUtils';
import { createPost, getAllPosts } from '@/services/postService';

export const GET = withErrorHandling(async (request: NextRequest) => {
	const url = new URL(request.url);
	const page = Number(url.searchParams.get('page') ?? '1');
	const limit = Number(url.searchParams.get('limit') ?? '9');
	const tag = url.searchParams.get('tag') ?? undefined;
	const category = url.searchParams.get('category') ?? undefined;
	const sort = url.searchParams.get('sort') ?? undefined;

	const result = await getAllPosts(page, limit, tag, category, sort);
	return apiSuccess(result);
});

export const POST = withAdmin(async (request: NextRequest) => {
	const body = (await request.json()) as Record<string, unknown>;

	const created = await createPost({
		title: String(body.title ?? ''),
		slug: body.slug == null ? undefined : String(body.slug),
		summary: String(body.summary ?? ''),
		content: String(body.content ?? ''),
		contentEn: body.contentEn == null ? '' : String(body.contentEn),
		category: body.category == null ? undefined : String(body.category),
		tags: Array.isArray(body.tags) ? body.tags.map((t) => String(t)) : [],
		thumbnailUrl: body.thumbnailUrl == null ? undefined : String(body.thumbnailUrl),
		chapterNumber: body.chapterNumber == null ? undefined : Number(body.chapterNumber),
		isPinned: Boolean(body.isPinned),
		isPublished: Boolean(body.isPublished),
	});

	// Invalidate all post-related caches
	revalidatePath('/', 'layout');

	return apiSuccess(created, 201);
});
