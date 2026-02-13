import { getToken } from 'next-auth/jwt';
import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

import { createLesson, listLessons } from '@/services/lessonService';

async function isAdmin(request: NextRequest): Promise<boolean> {
	const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
	return Boolean(token && (token as { role?: unknown }).role === 'admin');
}

export async function GET(request: NextRequest) {
	try {
		if (!(await isAdmin(request))) {
			return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
		}
		const { searchParams } = new URL(request.url);
		const page = Number(searchParams.get('page') ?? '1') || 1;
		const limit = Number(searchParams.get('limit') ?? '50') || 50;
		const unitId = searchParams.get('unitId') ?? undefined;
		const result = await listLessons({ page, limit, unitId });
		return NextResponse.json({ ok: true, data: result });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}

export async function POST(request: NextRequest) {
	try {
		if (!(await isAdmin(request))) {
			return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
		}

		const body = (await request.json()) as unknown;
		if (!body || typeof body !== 'object') {
			return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
		}

		const { unitId, title, content } = body as { unitId?: unknown; title?: unknown; content?: unknown };
		if (typeof unitId !== 'string' || !unitId.trim()) {
			return NextResponse.json({ ok: false, error: 'Missing unitId' }, { status: 400 });
		}

		const created = await createLesson({
			unitId: unitId.trim(),
			title: String(title ?? ''),
			content: String(content ?? ''),
		});

		// Revalidate learning page to ensure new lesson appears immediately
		revalidatePath('/admin/learning');

		return NextResponse.json({ ok: true, data: created }, { status: 201 });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}
