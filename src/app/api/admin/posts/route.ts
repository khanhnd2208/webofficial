import { type NextRequest } from 'next/server';

import { withAdmin, apiSuccess } from '@/lib/apiUtils';
import { getAdminPosts } from '@/services/postService';

export const GET = withAdmin(async (request: NextRequest) => {
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
	return apiSuccess(result);
});
