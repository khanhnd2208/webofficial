import { NextResponse, type NextRequest } from 'next/server';
import { getApiUser } from '@/lib/apiAuth';
import { approveComment, hideComment, adminDeleteComment, getPendingComments } from '@/services/commentService';

/** GET /api/admin/comments — list all pending comments */
export async function GET(request: NextRequest) {
	try {
		const user = await getApiUser(request);
		if (!user || (user as { role?: string }).role !== 'admin') {
			return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
		}

		const comments = await getPendingComments();
		return NextResponse.json({ ok: true, data: { items: comments } });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}

/** PATCH /api/admin/comments — approve, hide, or delete a comment */
export async function PATCH(request: NextRequest) {
	try {
		const user = await getApiUser(request);
		if (!user || (user as { role?: string }).role !== 'admin') {
			return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
		}

		const body = (await request.json()) as unknown;
		if (!body || typeof body !== 'object') {
			return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 });
		}

		const { action, commentId } = body as { action?: string; commentId?: string };
		if (!commentId || !action) {
			return NextResponse.json({ ok: false, error: 'action and commentId are required' }, { status: 400 });
		}

		switch (action) {
			case 'approve': {
				const updated = await approveComment(commentId);
				return NextResponse.json({ ok: true, data: updated });
			}
			case 'hide': {
				const updated = await hideComment(commentId);
				return NextResponse.json({ ok: true, data: updated });
			}
			case 'delete': {
				await adminDeleteComment(commentId);
				return NextResponse.json({ ok: true });
			}
			default:
				return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}
