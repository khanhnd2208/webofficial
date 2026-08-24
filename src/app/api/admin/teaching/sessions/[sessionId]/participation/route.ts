import { batchParticipationSchema, parseWithAppError, saveParticipation } from '@/features/teaching';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import type { NextRequest } from 'next/server';

export const PUT = withAdmin(async (request: NextRequest, user, context) =>
	apiSuccess(
		await saveParticipation(
			String((await context!.params).sessionId),
			parseWithAppError(batchParticipationSchema, await request.json()),
			user.id,
		),
	),
);
