import { getToken } from 'next-auth/jwt';
import { NextResponse, type NextRequest } from 'next/server';

import { attachUnitToCourse, detachUnitFromCourse, listCourseUnits } from '@/services/courseUnitService';
import { createUnit } from '@/services/unitService';

async function isAdmin(request: NextRequest): Promise<boolean> {
	const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
	return Boolean(token && (token as { role?: unknown }).role === 'admin');
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		if (!(await isAdmin(request))) {
			return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
		}
		const { id: courseId } = await params;
		const items = await listCourseUnits({ courseId });
		return NextResponse.json({ ok: true, data: items });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		if (!(await isAdmin(request))) {
			return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
		}
		const { id: courseId } = await params;
		const body = (await request.json()) as unknown;
		if (!body || typeof body !== 'object') {
			return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
		}
		const { unitId, name, order } = body as { unitId?: unknown; name?: unknown; order?: unknown };
		const cleanedName = typeof name === 'string' ? name.trim() : '';
		const cleanedUnitId = typeof unitId === 'string' ? unitId.trim() : '';

		const resolvedUnitId = cleanedName
			? (await createUnit({ name: cleanedName })).id
			: cleanedUnitId;

		if (!resolvedUnitId) {
			return NextResponse.json({ ok: false, error: 'Missing unitId or name' }, { status: 400 });
		}

		const attached = await attachUnitToCourse({
			courseId,
			unitId: resolvedUnitId,
			order: typeof order === 'number' ? order : undefined,
		});
		return NextResponse.json({ ok: true, data: attached }, { status: 201 });
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
		const { id: courseId } = await params;
		const { searchParams } = new URL(request.url);
		const unitId = searchParams.get('unitId') ?? '';
		if (!unitId.trim()) {
			return NextResponse.json({ ok: false, error: 'Missing unitId' }, { status: 400 });
		}
		const result = await detachUnitFromCourse({ courseId, unitId });
		return NextResponse.json({ ok: true, data: result });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}
