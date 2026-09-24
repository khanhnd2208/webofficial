import { reorderLearnOutline, reorderLearnOutlineSchema } from '@/features/learn';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { parseSchema } from '@/shared/validation/parse';

export const PUT = withAdmin(async (request, _user, context) => {
	const courseId = String((await context!.params).id);
	const body = parseSchema(reorderLearnOutlineSchema, await request.json());
	return apiSuccess(await reorderLearnOutline(courseId, body));
});
