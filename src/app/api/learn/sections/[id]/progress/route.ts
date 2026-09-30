import { updateLearnProgress, updateLearnProgressSchema } from '@/features/learn';
import { apiSuccess, withAuth } from '@/lib/apiUtils';
import { parseSchema } from '@/lib/validation/parse';

export const PATCH = withAuth(async (request, user, context) => {
	const sectionId = String((await context!.params).id);
	const body = parseSchema(updateLearnProgressSchema, await request.json());
	return apiSuccess(
		await updateLearnProgress(sectionId, { userId: user.id, isAdmin: user.role === 'admin' }, body),
	);
});
