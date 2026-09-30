import {
	createTeachingClass,
	createTeachingClassSchema,
	listTeachingClasses,
	parseWithAppError,
} from '@/features/teaching';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import type { NextRequest } from 'next/server';

export const GET = withAdmin(async () => apiSuccess(await listTeachingClasses()));

export const POST = withAdmin(async (request: NextRequest) =>
	apiSuccess(
		await createTeachingClass(parseWithAppError(createTeachingClassSchema, await request.json())),
		201,
	),
);
