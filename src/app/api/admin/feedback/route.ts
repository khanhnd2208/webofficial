import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

import { isAdmin } from '@/lib/apiAuth';
import { getFeedbackPageAdmin, updateFeedbackPage } from '@/services/feedbackService';

/** GET — fetch the feedback page (admin, always fresh) */
export async function GET(request: NextRequest) {
	try {
		if (!(await isAdmin(request))) {
			return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
		}

		const page = await getFeedbackPageAdmin();
		return NextResponse.json({ ok: true, data: page });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}

/** PATCH — update the feedback page content */
export async function PATCH(request: NextRequest) {
	try {
		if (!(await isAdmin(request))) {
			return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
		}

		const body = (await request.json()) as unknown;
		if (!body || typeof body !== 'object') {
			return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
		}

		const { title, content, isPublished } = body as {
			title?: unknown;
			content?: unknown;
			isPublished?: unknown;
		};

		const updated = await updateFeedbackPage({
			title: title != null ? String(title) : undefined,
			content: content != null ? String(content) : undefined,
			isPublished: isPublished != null ? Boolean(isPublished) : undefined,
		});

		revalidatePath('/', 'layout');

		return NextResponse.json({ ok: true, data: updated });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}
