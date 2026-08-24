import type { NextRequest } from 'next/server';

import {
	parseWithAppError,
	shareTeachingClass,
	shareTeachingClassSchema,
} from '@/features/teaching';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';

export const PATCH = withAdmin(async (request: NextRequest, _user, context) =>
	apiSuccess(
		await shareTeachingClass(
			String((await context!.params).classId),
			parseWithAppError(shareTeachingClassSchema, await request.json()),
		),
	),
);
