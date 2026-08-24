import {
	parseJsonWithAppError,
	participationLockSchema,
	resolveSessionLifecycleAction,
	setParticipationLifecycle,
} from '@/features/teaching';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import type { NextRequest } from 'next/server';

export const PATCH = withAdmin(async (request: NextRequest, user, context) => {
	const input = await parseJsonWithAppError(participationLockSchema, request);
	const sessionId = String((await context!.params).sessionId);
	return apiSuccess(
		await setParticipationLifecycle(sessionId, resolveSessionLifecycleAction(input), user.id),
	);
});
