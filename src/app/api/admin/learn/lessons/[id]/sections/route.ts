import { createLearnSection, createLearnSectionSchema } from '@/features/learn';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { parseSchema } from '@/lib/validation/parse';

export const POST = withAdmin(async (request, _user, context) => {
	const lessonId = String((await context!.params).id);
	const body = parseSchema(createLearnSectionSchema, await request.json());
	return apiSuccess(await createLearnSection(lessonId, body), 201);
});
