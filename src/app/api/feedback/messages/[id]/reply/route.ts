import { type NextRequest } from 'next/server';

import { withAuth, apiSuccess, apiError } from '@/lib/apiUtils';
import { addReplyToMessage, closeMessage } from '@/services/feedbackMessageService';

/**
 * PATCH /api/feedback/messages/[id]/reply
 * Authenticated users and admins can reply to a feedback thread.
 * Admin can also close the thread.
 */
export const PATCH = withAuth(async (request: NextRequest, user, context) => {
	const { id } = await context!.params;

	const body = (await request.json()) as unknown;
	if (typeof body !== 'object' || body === null) {
		return apiError('Invalid body', 400);
	}

	const { action, reply } = body as { action?: unknown; reply?: unknown };
	const isAdminUser = user.role === 'admin';

	// Close action — admin only
	if (action === 'close') {
		if (!isAdminUser) {
			return apiError('Forbidden', 403);
		}
		const msg = await closeMessage(id);
		if (!msg) {
			return apiError('Không tìm thấy tin nhắn', 404);
		}
		return apiSuccess(msg);
	}

	// Reply action — any authenticated participant
	// Non-admins can only reply to their own threads
	if (!isAdminUser) {
		const FeedbackMessage = (await import('@/models/FeedbackMessage')).default;
		const msgCheck = await FeedbackMessage.findById(id).select('userId').lean() as { userId?: string } | null;
		if (!msgCheck) {
			return apiError('Không tìm thấy tin nhắn', 404);
		}
		if (msgCheck.userId !== user.id) {
			return apiError('Forbidden', 403);
		}
	}

	if (typeof reply !== 'string' || !reply.trim()) {
		return apiError('Nội dung trả lời không được để trống', 400);
	}
	if (reply.trim().length > 5000) {
		return apiError('Nội dung trả lời tối đa 5000 ký tự', 400);
	}

	const msg = await addReplyToMessage(id, {
		role: isAdminUser ? 'admin' : 'user',
		authorId: user.id,
		authorName: user.name,
		content: reply.trim(),
	});

	if (!msg) {
		return apiError('Không tìm thấy tin nhắn', 404);
	}

	return apiSuccess(msg);
});
