import { getToken } from 'next-auth/jwt';
import { NextResponse, type NextRequest } from 'next/server';

/** Detect HTTPS for correct session cookie name */
function isSecure(req: NextRequest): boolean {
	return req.headers.get('x-forwarded-proto') === 'https' || req.url.startsWith('https:');
}

import dbConnect from '@/lib/dbConnect';
import Post from '@/models/Post';
import { createComment, getCommentsByPostId, toggleCommentLike } from '@/services/commentService';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ slug: string }> }
) {
	try {
		const { slug } = await params;

		// Get current user ID if logged in (for likedByMe)
		const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET, secureCookie: isSecure(request) });
		const currentUserId = token?.sub ?? undefined;

		await dbConnect();
		const post = await Post.findOne({ slug: slug.trim().toLowerCase(), isPublished: true })
			.select('_id')
			.lean();
		if (!post) {
			return NextResponse.json({ ok: false, error: 'Post not found' }, { status: 404 });
		}

		const url = new URL(request.url);
		const page = Number(url.searchParams.get('page') ?? '1');
		const limit = Number(url.searchParams.get('limit') ?? '50');

		const result = await getCommentsByPostId(String(post._id), page, limit, currentUserId);
		return NextResponse.json({ ok: true, data: result });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ slug: string }> }
) {
	try {
		const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET, secureCookie: isSecure(request) });
		if (!token || !token.sub) {
			return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
		}

		const { slug } = await params;

		await dbConnect();
		const post = await Post.findOne({ slug: slug.trim().toLowerCase(), isPublished: true })
			.select('_id')
			.lean();
		if (!post) {
			return NextResponse.json({ ok: false, error: 'Post not found' }, { status: 404 });
		}

		const body = (await request.json()) as unknown;
		if (!body || typeof body !== 'object') {
			return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 });
		}

		const { content } = body as { content?: unknown };

		const comment = await createComment({
			postId: String(post._id),
			userId: token.sub,
			userName: (token.name as string) ?? 'Anonymous',
			userImage: (token.picture as string) ?? undefined,
			content: String(content ?? ''),
		});

		return NextResponse.json({ ok: true, data: comment }, { status: 201 });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}

/** PATCH /api/posts/:slug/comments — toggle like on a comment */
export async function PATCH(
	request: NextRequest,
) {
	try {
		const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET, secureCookie: isSecure(request) });
		if (!token || !token.sub) {
			return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
		}

		const body = (await request.json()) as unknown;
		if (!body || typeof body !== 'object') {
			return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 });
		}

		const { commentId } = body as { commentId?: string };
		if (!commentId) {
			return NextResponse.json({ ok: false, error: 'commentId is required' }, { status: 400 });
		}

		const result = await toggleCommentLike(commentId, token.sub);
		return NextResponse.json({ ok: true, data: result });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}
