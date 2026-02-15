import { NextResponse, type NextRequest } from 'next/server';

import { isAdmin } from '@/lib/apiAuth';
import { getAdminPosts } from '@/services/postService';

export async function GET(request: NextRequest) {
	try {
		if (!(await isAdmin(request))) {
			return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
		}

		const url = new URL(request.url);
		const page = Number(url.searchParams.get('page') ?? '1');
		const limit = Number(url.searchParams.get('limit') ?? '20');
		const published = (url.searchParams.get('published') ?? 'all') as 'all' | 'true' | 'false';

		const opts = {
			tag: url.searchParams.get('tag') ?? undefined,
			category: url.searchParams.get('category') ?? undefined,
			search: url.searchParams.get('search') ?? undefined,
			sort: url.searchParams.get('sort') ?? undefined,
			dateFrom: url.searchParams.get('dateFrom') ?? undefined,
			dateTo: url.searchParams.get('dateTo') ?? undefined,
		};

		const result = await getAdminPosts(page, limit, published, opts);
		return NextResponse.json({ ok: true, data: result });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}
