import { NextResponse, type NextRequest } from 'next/server';
import { getApiUser } from '@/lib/apiAuth';
import dbConnect from '@/lib/dbConnect';
import Post from '@/models/Post';
import { createComment, getCommentsByPostId, toggleCommentLike, deleteComment } from '@/services/commentService';

type PostLean = { _id: unknown; title?: string };

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ slug: string }> }
) {
	try {
		const { slug } = await params;
		const user = await getApiUser(request);
		const isAdmin = (user as { role?: string } | null)?.role === 'admin';

		await dbConnect();
		const post = await Post.findOne({ slug: slug.trim().toLowerCase(), isPublished: true })
			.select('_id title')
			.lean() as PostLean | null;
		if (!post) {
			return NextResponse.json({ ok: false, error: 'Post not found' }, { status: 404 });
		}

		const result = await getCommentsByPostId(String(post._id), user?.id, isAdmin);
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
		const user = await getApiUser(request);
		if (!user) {
			return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
		}

		const { slug } = await params;

		await dbConnect();
		const post = await Post.findOne({ slug: slug.trim().toLowerCase(), isPublished: true })
			.select('_id title')
			.lean() as PostLean | null;
		if (!post) {
			return NextResponse.json({ ok: false, error: 'Post not found' }, { status: 404 });
		}

		const body = (await request.json()) as unknown;
		if (!body || typeof body !== 'object') {
			return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 });
		}

		const { content, parentId } = body as { content?: unknown; parentId?: unknown };

		const comment = await createComment({
			postId: String(post._id),
			postSlug: slug.trim().toLowerCase(),
			postTitle: typeof post.title === 'string' ? post.title : undefined,
			parentId: typeof parentId === 'string' ? parentId : null,
			userId: user.id,
			userName: user.name || 'Người dùng',
			userImage: user.image ?? undefined,
			content: String(content ?? ''),
		});

		return NextResponse.json({ ok: true, data: comment }, { status: 201 });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}

/** PATCH — toggle like OR user self-delete */
export async function PATCH(request: NextRequest) {
	try {
		const user = await getApiUser(request);
		if (!user) {
			return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
		}

		const body = (await request.json()) as unknown;
		if (!body || typeof body !== 'object') {
			return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 });
		}

		const { action, commentId } = body as { action?: string; commentId?: string };
		if (!commentId) {
			return NextResponse.json({ ok: false, error: 'commentId is required' }, { status: 400 });
		}

		if (action === 'delete') {
			await deleteComment(commentId, user.id);
			return NextResponse.json({ ok: true });
		}

		// Default: toggle like
		const result = await toggleCommentLike(commentId, user.id);
		return NextResponse.json({ ok: true, data: result });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}

