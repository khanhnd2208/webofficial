import { NextResponse, type NextRequest } from 'next/server';

import { getApiUser, isAdmin } from '@/lib/apiAuth';
import { createGrade, listGrades } from '@/services/gradeService';

/**
 * GET /api/grades?studentId=...
 *
 * - Admin: can query any studentId
 * - Logged-in student: can only view their own grades
 * - Unauthenticated: 401
 */
export async function GET(request: NextRequest) {
	try {
		const user = await getApiUser(request);
		if (!user) {
			return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
		}

		const url = new URL(request.url);
		let studentId = url.searchParams.get('studentId') ?? undefined;

		// Non-admin users can only view their own grades
		const admin = await isAdmin(request);
		if (!admin) {
			studentId = user.id;
		}

		const grades = await listGrades({ studentId });
		return NextResponse.json({ ok: true, data: grades });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}

/**
 * POST /api/grades — Admin only
 */
export async function POST(request: NextRequest) {
	try {
		const admin = await isAdmin(request);
		if (!admin) {
			return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
		}

		const body = (await request.json()) as unknown;
		if (!body || typeof body !== 'object') {
			return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
		}

		const { studentId, course, score, note } = body as {
			studentId?: unknown;
			course?: unknown;
			score?: unknown;
			note?: unknown;
		};

		const created = await createGrade({
			studentId: String(studentId ?? ''),
			course: String(course ?? ''),
			score: typeof score === 'string' ? Number(score) : (score as number),
			note: note == null ? undefined : String(note),
		});

		return NextResponse.json({ ok: true, data: created }, { status: 201 });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}
