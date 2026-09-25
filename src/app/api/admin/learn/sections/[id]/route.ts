import { deleteLearnSection, updateLearnSection, updateLearnSectionSchema } from '@/features/learn';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { parseSchema } from '@/shared/validation/parse';

export const PATCH = withAdmin(async (request, _user, context) => {
	const id = String((await context!.params).id);
	const body = parseSchema(updateLearnSectionSchema, await request.json());
	const full = new URL(request.url).searchParams.get('full') === '1';
	return apiSuccess(await updateLearnSection(id, body, { full }));
});

export const DELETE = withAdmin(async (_request, _user, context) => {
	const id = String((await context!.params).id);
	return apiSuccess(await deleteLearnSection(id));
});
