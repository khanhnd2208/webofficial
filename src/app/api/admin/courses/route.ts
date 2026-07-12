import { type NextRequest } from 'next/server';

import { courseService, createCourseSchema } from '@/features/courses';
import { withAdmin, apiSuccess } from '@/lib/apiUtils';
import { parseSchema } from '@/shared/validation/parse';

export const GET = withAdmin(async () => {
	const items = await courseService.listAdminCourses();
	return apiSuccess({ items });
});

export const POST = withAdmin(async (request: NextRequest) => {
	const body: unknown = await request.json();
	const input = parseSchema(createCourseSchema, body);
	const course = await courseService.createAdminCourse(input);
	return apiSuccess(course, 201);
});
