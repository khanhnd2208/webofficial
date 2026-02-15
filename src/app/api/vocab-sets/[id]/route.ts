import { getToken } from 'next-auth/jwt';
import { NextResponse, type NextRequest } from 'next/server';

import { getVocabSetById, updateVocabSet, deleteVocabSet } from '@/services/vocabSetService';

async function getUser(request: NextRequest) {
	const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
	if (!token?.email) return null;
	return {
		id: String(token.sub),
		email: token.email,
		name: String(token.name ?? ''),
		role: String(token.role ?? 'student'),
	};
}

type Params = { params: Promise<{ id: string }> };

/** GET /api/vocab-sets/:id */
export async function GET(_request: NextRequest, { params }: Params) {
	try {
		const { id } = await params;
		const set = await getVocabSetById(id);
		if (!set) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
		return NextResponse.json({ ok: true, data: set });
	} catch (error) {
		return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 });
	}
}

/** PUT /api/vocab-sets/:id */
export async function PUT(request: NextRequest, { params }: Params) {
	try {
		const user = await getUser(request);
		if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

		const { id } = await params;
		const existing = await getVocabSetById(id);
		if (!existing) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

		// Only owner or admin can edit
		if (existing.ownerId !== user.id && user.role !== 'admin') {
			return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
		}

		const body = await request.json();
		const updated = await updateVocabSet({
			id,
			title: body.title,
			description: body.description,
			terms: body.terms,
			isPublic: user.role === 'admin' ? body.isPublic : undefined,
		});
		if (!updated) return NextResponse.json({ ok: false, error: 'Update failed' }, { status: 400 });
		return NextResponse.json({ ok: true, data: updated });
	} catch (error) {
		return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 });
	}
}

/** DELETE /api/vocab-sets/:id */
export async function DELETE(request: NextRequest, { params }: Params) {
	try {
		const user = await getUser(request);
		if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

		const { id } = await params;
		const existing = await getVocabSetById(id);
		if (!existing) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

		if (existing.ownerId !== user.id && user.role !== 'admin') {
			return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
		}

		await deleteVocabSet(id);
		return NextResponse.json({ ok: true });
	} catch (error) {
		return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 });
	}
}
