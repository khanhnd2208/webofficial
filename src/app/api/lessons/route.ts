import { NextResponse, type NextRequest } from 'next/server';

import { listLessons } from '@/services/lessonService';

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const unitId = searchParams.get('unitId') ?? undefined;
		const page = Number(searchParams.get('page') ?? '1') || 1;
		const limit = Number(searchParams.get('limit') ?? '50') || 50;

		const result = await listLessons({ page, limit, unitId });
		return NextResponse.json({ ok: true, data: result });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}
