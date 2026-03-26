import { type NextRequest } from 'next/server';
import { getApiUser } from '@/lib/apiAuth';
import { withAuth, withErrorHandling, apiSuccess, apiError } from '@/lib/apiUtils';
import dbConnect from '@/lib/dbConnect';
import Post from '@/models/Post';
import { createComment, getCommentsByPostId, toggleCommentLike, deleteComment } from '@/services/commentService';

type PostLean = { _id: unknown; title?: string };

export const GET = withErrorHandling(async (request: NextRequest, context) => {
	const { slug } = await context!.params;
	const user = await getApiUser(request);
	const isAdmin = user?.role === 'admin';

	await dbConnect();
	const post = await Post.findOne({ slug: slug.trim().toLowerCase(), isPublished: true })
		.select('_id title')
		.lean() as PostLean | null;
	if (!post) {
		return apiError('Post not found', 404);
	}

	const result = await getCommentsByPostId(String(post._id), user?.id, isAdmin);
	return apiSuccess(result);
});

export const POST = withAuth(async (request: NextRequest, user, context) => {
	const { slug } = await context!.params;

	await dbConnect();
	const post = await Post.findOne({ slug: slug.trim().toLowerCase(), isPublished: true })
		.select('_id title')
		.lean() as PostLean | null;
	if (!post) {
		return apiError('Post not found', 404);
	}

	const body = (await request.json()) as unknown;
	if (!body || typeof body !== 'object') {
		return apiError('Invalid body', 400);
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

	return apiSuccess(comment, 201);
});

/** PATCH — toggle like OR user self-delete */
export const PATCH = withAuth(async (request: NextRequest, user) => {
	const body = (await request.json()) as unknown;
	if (!body || typeof body !== 'object') {
		return apiError('Invalid body', 400);
	}

	const { action, commentId } = body as { action?: string; commentId?: string };
	if (!commentId) {
		return apiError('commentId is required', 400);
	}

	if (action === 'delete') {
		await deleteComment(commentId, user.id);
		return apiSuccess(null);
	}

	// Default: toggle like
	const result = await toggleCommentLike(commentId, user.id);
	return apiSuccess(result);
});

