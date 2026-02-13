import { getToken } from 'next-auth/jwt';
import { NextResponse, type NextRequest } from 'next/server';

import { getAdminPosts } from '@/services/postService';

async function isAdmin(request: NextRequest): Promise<boolean> {
	const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
	return Boolean(token && (token as { role?: unknown }).role === 'admin');
}

export async function GET(request: NextRequest) {
	try {
		if (!(await isAdmin(request))) {
			return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
		}

		const url = new URL(request.url);
		const page = Number(url.searchParams.get('page') ?? '1');
		const limit = Number(url.searchParams.get('limit') ?? '20');
		const published = (url.searchParams.get('published') ?? 'all') as 'all' | 'true' | 'false';

		const result = await getAdminPosts(page, limit, published);
		return NextResponse.json({ ok: true, data: result });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}
