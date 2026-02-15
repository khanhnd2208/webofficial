import { NextResponse } from 'next/server';

import { getAllTags } from '@/services/postService';

export async function GET() {
	try {
		const tags = await getAllTags();
		return NextResponse.json({ ok: true, data: tags });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}
