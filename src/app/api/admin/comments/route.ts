import { type NextRequest } from 'next/server';
import { withAdmin, apiSuccess, apiError } from '@/lib/apiUtils';
import { approveComment, hideComment, adminDeleteComment, getPendingComments, getAllComments } from '@/services/commentService';

/** GET /api/admin/comments — list comments; ?status=all returns all, otherwise returns pending only */
export const GET = withAdmin(async (request: NextRequest) => {
	const url = new URL(request.url);
	const showAll = url.searchParams.get('status') === 'all';
	const comments = showAll ? await getAllComments() : await getPendingComments();
	return apiSuccess({ items: comments });
});

/** PATCH /api/admin/comments — approve, hide, or delete a comment */
export const PATCH = withAdmin(async (request: NextRequest) => {
	const body = (await request.json()) as unknown;
	if (!body || typeof body !== 'object') {
		return apiError('Invalid body', 400);
	}

	const { action, commentId } = body as { action?: string; commentId?: string };
	if (!commentId || !action) {
		return apiError('action and commentId are required', 400);
	}

	switch (action) {
		case 'approve': {
			const updated = await approveComment(commentId);
			return apiSuccess(updated);
		}
		case 'hide': {
			const updated = await hideComment(commentId);
			return apiSuccess(updated);
		}
		case 'delete': {
			await adminDeleteComment(commentId);
			return apiSuccess(null);
		}
		default:
			return apiError('Unknown action', 400);
	}
});
