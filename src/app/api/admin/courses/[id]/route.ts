import { type NextRequest } from 'next/server';

import { courseService, updateCourseSchema } from '@/features/courses';
import { withAdmin, apiSuccess } from '@/lib/apiUtils';
import { parseSchema } from '@/shared/validation/parse';

export const GET = withAdmin(async (_request: NextRequest, _user, context) => {
	const { id } = await context!.params;
	const course = await courseService.getAdminCourse(String(id));
	return apiSuccess(course);
});

export const PATCH = withAdmin(async (request: NextRequest, _user, context) => {
	const { id } = await context!.params;
	const body: unknown = await request.json();
	const input = parseSchema(updateCourseSchema, body);
	const course = await courseService.updateAdminCourse(String(id), input);
	return apiSuccess(course);
});

export const DELETE = withAdmin(async (_request: NextRequest, _user, context) => {
	const { id } = await context!.params;
	await courseService.deleteAdminCourse(String(id));
	return apiSuccess(null);
});
