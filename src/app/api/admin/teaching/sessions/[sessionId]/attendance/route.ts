import { batchAttendanceSchema, parseWithAppError, saveAttendance } from '@/features/teaching';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import type { NextRequest } from 'next/server';

export const PUT = withAdmin(async (request: NextRequest, user, context) =>
	apiSuccess(
		await saveAttendance(
			String((await context!.params).sessionId),
			parseWithAppError(batchAttendanceSchema, await request.json()),
			user.id,
		),
	),
);
