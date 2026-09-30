import { createLearnCourse, createLearnCourseSchema } from '@/features/learn';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { parseSchema } from '@/lib/validation/parse';

export const POST = withAdmin(async (request) => {
	const body = parseSchema(createLearnCourseSchema, await request.json());
	return apiSuccess(await createLearnCourse(body), 201);
});
