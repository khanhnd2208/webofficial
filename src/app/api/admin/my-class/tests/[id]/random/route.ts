import {
	bankFilterFromSearch,
	parseWithAppError,
	randomFillSchema,
	randomFillTest,
} from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const POST = withAdmin(async (request: NextRequest, _user, context) => {
	const body = parseWithAppError(randomFillSchema, await request.json().catch(() => ({})));
	return apiSuccess(
		await randomFillTest(
			String((await context!.params).id),
			bankFilterFromSearch(request.nextUrl.searchParams),
			body.count,
			body.replace,
		),
	);
});
