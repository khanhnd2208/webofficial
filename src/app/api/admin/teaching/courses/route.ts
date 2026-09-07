import {
	createTeachingCourse,
	createTeachingCourseSchema,
	listTeachingCourses,
	parseWithAppError,
} from '@/features/teaching';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import type { NextRequest } from 'next/server';

export const GET = withAdmin(async () => apiSuccess(await listTeachingCourses()));

export const POST = withAdmin(async (request: NextRequest) =>
	apiSuccess(
		await createTeachingCourse(parseWithAppError(createTeachingCourseSchema, await request.json())),
		201,
	),
);
