import { NextResponse, type NextRequest } from 'next/server';

import { getLessonById } from '@/services/lessonService';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const lesson = await getLessonById(id);
		if (!lesson) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
		return NextResponse.json({ ok: true, data: lesson });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}
