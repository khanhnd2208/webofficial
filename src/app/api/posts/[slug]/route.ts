import { NextResponse, type NextRequest } from 'next/server';

import { getPostBySlug } from '@/services/postService';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
	try {
		const { slug } = await params;
		const post = await getPostBySlug(slug);
		if (!post) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
		return NextResponse.json({ ok: true, data: post });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}
