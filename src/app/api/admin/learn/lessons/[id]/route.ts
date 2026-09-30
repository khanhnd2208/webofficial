import { deleteLearnLesson, updateLearnLesson, updateLearnLessonSchema } from '@/features/learn';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { parseSchema } from '@/lib/validation/parse';

export const PATCH = withAdmin(async (request, _user, context) => {
	const id = String((await context!.params).id);
	const body = parseSchema(updateLearnLessonSchema, await request.json());
	return apiSuccess(await updateLearnLesson(id, body));
});

export const DELETE = withAdmin(async (_request, _user, context) => {
	const id = String((await context!.params).id);
	return apiSuccess(await deleteLearnLesson(id));
});
