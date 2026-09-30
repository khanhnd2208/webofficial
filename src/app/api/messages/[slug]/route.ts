import { type NextRequest } from 'next/server';

import { withAdmin, apiSuccess } from '@/lib/apiUtils';
import { deleteMessage, getMessageBySlugForOwner, updateMessage } from '@/services/messageService';
import type { UpdateMessageInput } from '@/types/message';

export const GET = withAdmin(async (_request: NextRequest, user, context) => {
	const { slug } = await context!.params;
	const message = await getMessageBySlugForOwner(String(slug), user.id);
	return apiSuccess(message);
});

export const PUT = withAdmin(async (request: NextRequest, user, context) => {
	const { slug } = await context!.params;
	const body = (await request.json()) as Record<string, unknown>;

	const input: UpdateMessageInput = {};

	if (body.title !== undefined) input.title = String(body.title);
	if (body.recipientName !== undefined) input.recipientName = String(body.recipientName);
	if (body.content !== undefined) input.content = String(body.content);
	if (body.displayFont !== undefined) {
		input.displayFont = body.displayFont == null ? null : String(body.displayFont);
	}
	if (body.coverImageUrl !== undefined) {
		input.coverImageUrl = body.coverImageUrl == null ? null : String(body.coverImageUrl);
	}
	if (body.musicTrack !== undefined) {
		input.musicTrack = body.musicTrack == null ? null : String(body.musicTrack);
	}
	if (body.password !== undefined) {
		input.password = body.password == null ? null : String(body.password);
	}
	if (body.isPublished !== undefined) input.isPublished = Boolean(body.isPublished);
	if (body.expiresAt !== undefined) {
		input.expiresAt = body.expiresAt == null ? null : String(body.expiresAt);
	}

	const updated = await updateMessage(String(slug), user.id, input);
	return apiSuccess(updated);
});

export const DELETE = withAdmin(async (_request: NextRequest, user, context) => {
	const { slug } = await context!.params;
	await deleteMessage(String(slug), user.id);
	return apiSuccess({ deleted: true });
});
