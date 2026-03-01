import { NextResponse, type NextRequest } from 'next/server';

import { getApiUser, isAdmin } from '@/lib/apiAuth';
import { createFeedbackMessage, getUserMessages, getAllMessages } from '@/services/feedbackMessageService';

/**
 * GET /api/feedback/messages
 * - Authenticated user: returns their own messages
 * - Admin: returns all messages
 */
export async function GET(request: NextRequest) {
	try {
		const user = await getApiUser(request);
		if (!user) {
			return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
		}

		const admin = await isAdmin(request);
		const messages = admin ? await getAllMessages() : await getUserMessages(user.id);

		return NextResponse.json({ ok: true, data: { items: messages, total: messages.length } });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 500 });
	}
}

/**
 * POST /api/feedback/messages
 * - Authenticated user sends a new feedback message
 */
export async function POST(request: NextRequest) {
	try {
		const user = await getApiUser(request);
		if (!user) {
			return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
		}

		const body = (await request.json()) as unknown;
		if (typeof body !== 'object' || body === null) {
			return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 });
		}

		const { subject, content, sourceUrl } = body as { subject?: unknown; content?: unknown; sourceUrl?: unknown };

		if (typeof subject !== 'string' || !subject.trim()) {
			return NextResponse.json({ ok: false, error: 'Tiêu đề không được để trống' }, { status: 400 });
		}
		if (typeof content !== 'string' || !content.trim()) {
			return NextResponse.json({ ok: false, error: 'Nội dung không được để trống' }, { status: 400 });
		}
		if (subject.trim().length > 200) {
			return NextResponse.json({ ok: false, error: 'Tiêu đề tối đa 200 ký tự' }, { status: 400 });
		}
		if (content.trim().length > 5000) {
			return NextResponse.json({ ok: false, error: 'Nội dung tối đa 5000 ký tự' }, { status: 400 });
		}

		const msg = await createFeedbackMessage({
			userId: user.id,
			userName: user.name,
			userEmail: user.email,
			subject: subject.trim(),
			content: content.trim(),
			sourceUrl: typeof sourceUrl === 'string' && sourceUrl.trim() ? sourceUrl.trim() : undefined,
		});

		return NextResponse.json({ ok: true, data: msg }, { status: 201 });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 500 });
	}
}
