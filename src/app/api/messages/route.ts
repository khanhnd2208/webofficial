import { type NextRequest } from 'next/server';

import { withAuth, apiSuccess } from '@/lib/apiUtils';
import { createMessage, getMessagesByUser } from '@/services/messageService';
import type { CreateMessageInput } from '@/types/message';

export const GET = withAuth(async (_request: NextRequest, user) => {
	const messages = await getMessagesByUser(user.id);
	return apiSuccess(messages);
});

export const POST = withAuth(async (request: NextRequest, user) => {
	const body = (await request.json()) as Record<string, unknown>;

	const input: CreateMessageInput = {
		title: String(body.title ?? ''),
		recipientName: String(body.recipientName ?? ''),
		content: String(body.content ?? ''),
		displayFont: body.displayFont == null ? undefined : String(body.displayFont),
		coverImageUrl: body.coverImageUrl == null ? undefined : String(body.coverImageUrl),
		musicTrack: body.musicTrack == null ? undefined : String(body.musicTrack),
		password: body.password == null ? undefined : String(body.password),
		isPublished: Boolean(body.isPublished),
		expiresAt: body.expiresAt == null ? undefined : String(body.expiresAt),
	};

	const created = await createMessage(user.id, input);
	return apiSuccess(created, 201);
});
