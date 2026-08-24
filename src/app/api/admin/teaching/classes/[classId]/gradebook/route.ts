import { getGradebook } from '@/features/teaching';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';

export const GET = withAdmin(async (_request, _user, context) =>
	apiSuccess(await getGradebook(String((await context!.params).classId))),
);
