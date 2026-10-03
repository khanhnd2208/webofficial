import type { RecallRouteHandler } from '@/features/active-recall/analytics/request';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { recallReportFilters } from '@/features/active-recall/analytics/time';
import { getRecallReport } from '@/features/active-recall/analytics/report';
export const GET: RecallRouteHandler = withAdmin(async (request) => {
	const filters = recallReportFilters(Object.fromEntries(request.nextUrl.searchParams));
	const response = apiSuccess(await getRecallReport(filters));
	response.headers.set('Cache-Control', 'no-store');
	return response;
});
