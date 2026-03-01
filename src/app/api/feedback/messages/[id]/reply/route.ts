import { NextResponse, type NextRequest } from 'next/server';

import { isAdmin } from '@/lib/apiAuth';
import { replyToMessage, closeMessage } from '@/services/feedbackMessageService';

/**
 * PATCH /api/feedback/messages/[id]/reply
 * Admin-only: reply to or close a feedback message
 */
export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const admin = await isAdmin(request);
		if (!admin) {
			return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
		}

		const { id } = await params;

		const body = (await request.json()) as unknown;
		if (typeof body !== 'object' || body === null) {
			return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 });
		}

		const { action, reply } = body as { action?: unknown; reply?: unknown };

		if (action === 'close') {
			const msg = await closeMessage(id);
			if (!msg) {
				return NextResponse.json({ ok: false, error: 'Không tìm thấy tin nhắn' }, { status: 404 });
			}
			return NextResponse.json({ ok: true, data: msg });
		}

		// Default action: reply
		if (typeof reply !== 'string' || !reply.trim()) {
			return NextResponse.json({ ok: false, error: 'Nội dung trả lời không được để trống' }, { status: 400 });
		}
		if (reply.trim().length > 5000) {
			return NextResponse.json({ ok: false, error: 'Nội dung trả lời tối đa 5000 ký tự' }, { status: 400 });
		}

		const msg = await replyToMessage(id, reply.trim());
		if (!msg) {
			return NextResponse.json({ ok: false, error: 'Không tìm thấy tin nhắn' }, { status: 404 });
		}

		return NextResponse.json({ ok: true, data: msg });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 500 });
	}
}
