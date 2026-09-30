import {
	createLearnLesson,
	createLearnLessonSchema,
	importLearnLessonSchema,
	importLearnMarkdown,
} from '@/features/learn';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { parseSchema } from '@/shared/validation/parse';

/** `{ markdown }` imports NDK lessons; anything else creates an empty lesson. */
export const POST = withAdmin(async (request, _user, context) => {
	const courseId = String((await context!.params).id);
	const json: unknown = await request.json();
	if (json && typeof json === 'object' && 'markdown' in json) {
		const body = parseSchema(importLearnLessonSchema, json);
		const lessons = await importLearnMarkdown(courseId, body);
		return apiSuccess(
			body.mode === 'create' && lessons.length === 1 ? lessons[0] : { lessons },
			201,
		);
	}
	const body = parseSchema(createLearnLessonSchema, json);
	return apiSuccess(await createLearnLesson(courseId, body), 201);
});
