import { NextResponse } from 'next/server';

import { createGrade, listGrades } from '@/services/gradeService';

export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const studentId = url.searchParams.get('studentId') ?? undefined;
		const grades = await listGrades({ studentId });
		return NextResponse.json({ ok: true, data: grades });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}

export async function POST(request: Request) {
	try {
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
