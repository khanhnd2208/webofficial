import type { RecallRouteHandler } from '@/features/active-recall/analytics/request';
import { apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { beginRecallSchema } from '@/features/active-recall/analytics/contracts';
import { beginRecallStudy } from '@/features/active-recall/analytics/collection';
import { recallRequest } from '@/features/active-recall/analytics/request';
export const POST: RecallRouteHandler = withErrorHandling(async (request) => {
	const actor = await recallRequest(request, beginRecallSchema, true);
	const response = apiSuccess(
		actor.excluded ? { excluded: true } : await beginRecallStudy(actor.visitorId, actor.input),
	);
	response.headers.set('Cache-Control', 'no-store');
	return response;
});
