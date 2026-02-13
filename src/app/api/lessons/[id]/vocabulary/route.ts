import { NextResponse, type NextRequest } from 'next/server';

import { listLessonVocabulary } from '@/services/lessonVocabularyService';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const items = await listLessonVocabulary(id);
		return NextResponse.json({ ok: true, data: items });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}
