import {
	createLearnLesson,
	createLearnLessonSchema,
	importLearnLesson,
	importLearnLessonSchema,
} from '@/features/learn';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { parseSchema } from '@/shared/validation/parse';

/** `{ markdown }` imports a whole NDK lesson; anything else creates an empty lesson. */
export const POST = withAdmin(async (request, _user, context) => {
	const courseId = String((await context!.params).id);
	const json: unknown = await request.json();
	if (json && typeof json === 'object' && 'markdown' in json) {
		const { markdown } = parseSchema(importLearnLessonSchema, json);
		return apiSuccess(await importLearnLesson(courseId, markdown), 201);
	}
	const body = parseSchema(createLearnLessonSchema, json);
	return apiSuccess(await createLearnLesson(courseId, body), 201);
});
