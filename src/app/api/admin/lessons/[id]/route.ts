import { getToken } from 'next-auth/jwt';
import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

import { deleteLesson, updateLesson } from '@/services/lessonService';

async function isAdmin(request: NextRequest): Promise<boolean> {
	const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
	return Boolean(token && (token as { role?: unknown }).role === 'admin');
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		if (!(await isAdmin(request))) {
			return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
		}

		const { id } = await params;
		const body = (await request.json()) as unknown;
		if (!body || typeof body !== 'object') {
			return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
		}

		const { unitId, title, content } = body as { unitId?: unknown; title?: unknown; content?: unknown };
		if (typeof unitId !== 'string' || !unitId.trim()) {
			return NextResponse.json({ ok: false, error: 'Missing unitId' }, { status: 400 });
		}
		const updated = await updateLesson({
			id,
			unitId: unitId.trim(),
			title: String(title ?? ''),
			content: String(content ?? ''),
		});
		
		// Revalidate learning page after update
		revalidatePath('/admin/learning');
		
		return NextResponse.json({ ok: true, data: updated });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		if (!(await isAdmin(request))) {
			return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
		}
		const { id } = await params;
		const result = await deleteLesson({ id });
		
		// Revalidate learning page after deletion
		revalidatePath('/admin/learning');
		
		return NextResponse.json({ ok: true, data: result });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}
