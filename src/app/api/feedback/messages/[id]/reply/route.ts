import { NextResponse, type NextRequest } from 'next/server';

import { getApiUser, isAdmin } from '@/lib/apiAuth';
import { addReplyToMessage, closeMessage } from '@/services/feedbackMessageService';

/**
 * PATCH /api/feedback/messages/[id]/reply
 * Authenticated users and admins can reply to a feedback thread.
 * Admin can also close the thread.
 */
export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const user = await getApiUser(request);
		if (!user) {
			return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
		}

		const admin = await isAdmin(request);
		const { id } = await params;

		const body = (await request.json()) as unknown;
		if (typeof body !== 'object' || body === null) {
			return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 });
		}

		const { action, reply } = body as { action?: unknown; reply?: unknown };

		// Close action — admin only
		if (action === 'close') {
			if (!admin) {
				return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
			}
			const msg = await closeMessage(id);
			if (!msg) {
				return NextResponse.json({ ok: false, error: 'Không tìm thấy tin nhắn' }, { status: 404 });
			}
			return NextResponse.json({ ok: true, data: msg });
		}

		// Reply action — any authenticated participant
		if (typeof reply !== 'string' || !reply.trim()) {
			return NextResponse.json({ ok: false, error: 'Nội dung trả lời không được để trống' }, { status: 400 });
		}
		if (reply.trim().length > 5000) {
			return NextResponse.json({ ok: false, error: 'Nội dung trả lời tối đa 5000 ký tự' }, { status: 400 });
		}

		const msg = await addReplyToMessage(id, {
			role: admin ? 'admin' : 'user',
			authorId: user.id,
			authorName: user.name,
			content: reply.trim(),
		});

		if (!msg) {
			return NextResponse.json({ ok: false, error: 'Không tìm thấy tin nhắn' }, { status: 404 });
		}

		return NextResponse.json({ ok: true, data: msg });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 500 });
	}
}
