import { getToken } from 'next-auth/jwt';
import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

import { createPost, getAllPosts } from '@/services/postService';

async function isAdmin(request: NextRequest): Promise<boolean> {
	const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
	return Boolean(token && (token as { role?: unknown }).role === 'admin');
}

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
			tags,
			thumbnailUrl,
			isPublished,
		} = body as {
			title?: unknown;
			slug?: unknown;
			summary?: unknown;
			content?: unknown;
			tags?: unknown;
			thumbnailUrl?: unknown;
			isPublished?: unknown;
		};

		const created = await createPost({
			title: String(title ?? ''),
			slug: slug == null ? undefined : String(slug),
			summary: String(summary ?? ''),
			content: String(content ?? ''),
			tags: Array.isArray(tags) ? tags.map((t) => String(t)) : [],
			thumbnailUrl: thumbnailUrl == null ? undefined : String(thumbnailUrl),
			isPublished: Boolean(isPublished),
		});

		// Make published content visible immediately.
		revalidatePath('/');
		revalidatePath('/blog');
		revalidatePath(`/blog/${created.slug}`);

		return NextResponse.json({ ok: true, data: created }, { status: 201 });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}
