import { deleteLearnCourse, updateLearnCourse, updateLearnCourseSchema } from '@/features/learn';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { parseSchema } from '@/shared/validation/parse';

export const PATCH = withAdmin(async (request, _user, context) => {
	const id = String((await context!.params).id);
	const body = parseSchema(updateLearnCourseSchema, await request.json());
	return apiSuccess(await updateLearnCourse(id, body));
});

export const DELETE = withAdmin(async (_request, _user, context) => {
	const id = String((await context!.params).id);
	return apiSuccess(await deleteLearnCourse(id));
});
