import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

import { isAdmin } from '@/lib/apiAuth';
import { deletePostById, getAdminPostById, updatePostById } from '@/services/postService';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		if (!(await isAdmin(request))) {
			return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
		}

		const { id } = await params;
		const post = await getAdminPostById(id);
		if (!post) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
		return NextResponse.json({ ok: true, data: post });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
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

		const updated = await updatePostById(id, body as Record<string, unknown>);

		revalidatePath('/', 'layout');
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
		await deletePostById(id);

		revalidatePath('/', 'layout');
		return NextResponse.json({ ok: true, data: { id } });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}
