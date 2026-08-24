import { parseWithAppError, updateSession, updateSessionSchema } from '@/features/teaching';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import type { NextRequest } from 'next/server';

export const PATCH = withAdmin(async (request: NextRequest, _user, context) =>
	apiSuccess(
		await updateSession(
			String((await context!.params).sessionId),
			parseWithAppError(updateSessionSchema, await request.json()),
		),
	),
);
