import type { RecallRouteHandler } from '@/features/active-recall/analytics/request';
import { apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { heartbeatRecallSchema } from '@/features/active-recall/analytics/contracts';
import { heartbeatRecallStudy } from '@/features/active-recall/analytics/collection';
import { recallRequest } from '@/features/active-recall/analytics/request';
export const POST: RecallRouteHandler = withErrorHandling(async (request) => {
	const actor = await recallRequest(request, heartbeatRecallSchema, false);
	const response = apiSuccess(
		actor.excluded ? { excluded: true } : await heartbeatRecallStudy(actor.visitorId, actor.input),
	);
	response.headers.set('Cache-Control', 'no-store');
	return response;
});
