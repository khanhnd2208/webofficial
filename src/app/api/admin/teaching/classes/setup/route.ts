import {
	parseWithAppError,
	setupTeachingClass,
	setupTeachingClassFromRoster,
	teachingClassSetupFromRosterSchema,
	teachingClassSetupSchema,
} from '@/features/teaching';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import type { NextRequest } from 'next/server';

export const POST = withAdmin(async (request: NextRequest) => {
	const body: unknown = await request.json();
	if (body && typeof body === 'object' && 'rows' in body) {
		return apiSuccess(
			await setupTeachingClassFromRoster(parseWithAppError(teachingClassSetupFromRosterSchema, body)),
			201,
		);
	}
	return apiSuccess(await setupTeachingClass(parseWithAppError(teachingClassSetupSchema, body)), 201);
});
