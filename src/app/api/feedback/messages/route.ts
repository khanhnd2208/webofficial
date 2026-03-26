import { type NextRequest } from 'next/server';

import { withAuth, apiSuccess, apiError } from '@/lib/apiUtils';
import { createFeedbackMessage, getUserMessages, getAllMessages } from '@/services/feedbackMessageService';

/**
 * GET /api/feedback/messages
 * - Authenticated user: returns their own messages
 * - Admin: returns all messages
 */
export const GET = withAuth(async (_request: NextRequest, user) => {
	const messages = user.role === 'admin' ? await getAllMessages() : await getUserMessages(user.id);
	return apiSuccess({ items: messages, total: messages.length });
});

/**
 * POST /api/feedback/messages
 * - Authenticated user sends a new feedback message
 */
export const POST = withAuth(async (request: NextRequest, user) => {
	const body = (await request.json()) as unknown;
	if (typeof body !== 'object' || body === null) {
		return apiError('Invalid body', 400);
	}

	const { subject, content, sourceUrl } = body as { subject?: unknown; content?: unknown; sourceUrl?: unknown };

	if (typeof subject !== 'string' || !subject.trim()) {
		return apiError('Tiêu đề không được để trống', 400);
	}
	if (typeof content !== 'string' || !content.trim()) {
		return apiError('Nội dung không được để trống', 400);
	}
	if (subject.trim().length > 200) {
		return apiError('Tiêu đề tối đa 200 ký tự', 400);
	}
	if (content.trim().length > 5000) {
		return apiError('Nội dung tối đa 5000 ký tự', 400);
	}

	const msg = await createFeedbackMessage({
		userId: user.id,
		userName: user.name,
		userEmail: user.email,
		subject: subject.trim(),
		content: content.trim(),
		sourceUrl: typeof sourceUrl === 'string' && sourceUrl.trim() ? sourceUrl.trim() : undefined,
	});

	return apiSuccess(msg, 201);
});
