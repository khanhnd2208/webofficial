import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

import { isAdmin } from '@/lib/apiAuth';
import { createPost, getAllPosts } from '@/services/postService';

export async function GET(request: NextRequest) {
	try {
		const url = new URL(request.url);
		const page = Number(url.searchParams.get('page') ?? '1');
		const limit = Number(url.searchParams.get('limit') ?? '9');
		const tag = url.searchParams.get('tag') ?? undefined;

		const result = await getAllPosts(page, limit, tag);
		return NextResponse.json({ ok: true, data: result });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}

export async function POST(request: NextRequest) {
	try {
		if (!(await isAdmin(request))) {
			return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
		}

		const body = (await request.json()) as unknown;
		if (!body || typeof body !== 'object') {
			return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
		}

		const {
			title,
			slug,
			summary,
			content,
			contentFormat,
			category,
			tags,
			thumbnailUrl,
			chapterNumber,
			isPublished,
		} = body as {
			title?: unknown;
			slug?: unknown;
			summary?: unknown;
			content?: unknown;
			contentFormat?: unknown;
			category?: unknown;
			tags?: unknown;
			thumbnailUrl?: unknown;
			chapterNumber?: unknown;
			isPublished?: unknown;
		};

		const created = await createPost({
			title: String(title ?? ''),
			slug: slug == null ? undefined : String(slug),
			summary: String(summary ?? ''),
			content: String(content ?? ''),
			contentFormat: contentFormat === 'markdown' ? 'markdown' : 'html',
			category: category == null ? undefined : String(category),
			tags: Array.isArray(tags) ? tags.map((t) => String(t)) : [],
			thumbnailUrl: thumbnailUrl == null ? undefined : String(thumbnailUrl),
			chapterNumber: chapterNumber == null ? undefined : Number(chapterNumber),
			isPublished: Boolean(isPublished),
		});

		// Invalidate all post-related caches
		revalidatePath('/', 'layout');

		return NextResponse.json({ ok: true, data: created }, { status: 201 });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}
