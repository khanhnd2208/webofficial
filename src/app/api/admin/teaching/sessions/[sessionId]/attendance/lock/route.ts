import {
	attendanceLockSchema,
	parseJsonWithAppError,
	resolveSessionLifecycleAction,
	setAttendanceLifecycle,
} from '@/features/teaching';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import type { NextRequest } from 'next/server';

export const PATCH = withAdmin(async (request: NextRequest, user, context) => {
	const input = await parseJsonWithAppError(attendanceLockSchema, request);
	const sessionId = String((await context!.params).sessionId);
	return apiSuccess(
		await setAttendanceLifecycle(
			sessionId,
			resolveSessionLifecycleAction(input),
			user.id,
			input.heldOn,
		),
	);
});
