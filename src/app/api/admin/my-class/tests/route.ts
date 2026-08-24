import {
	createTest,
	createTestSchema,
	listAdminTestTable,
	listAdminTests,
	parseWithAppError,
	testTableQueryFromSearch,
} from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const GET = withAdmin(async (request: NextRequest) => {
	const search = Object.fromEntries(request.nextUrl.searchParams.entries());
	if (search.picker === '1') {
		const items = await listAdminTests({ q: search.q || undefined });
		return apiSuccess(items);
	}
	return apiSuccess(await listAdminTestTable(testTableQueryFromSearch(search)));
});

export const POST = withAdmin(async (request: NextRequest) =>
	apiSuccess(await createTest(parseWithAppError(createTestSchema, await request.json())), 201),
);
