import { beginLearnStudy, beginLearnStudySchema } from '@/features/learn';
import { apiSuccess, withAuth } from '@/lib/apiUtils';
import { parseSchema } from '@/shared/validation/parse';

export const POST = withAuth(async (request, user) => {
	const body = parseSchema(beginLearnStudySchema, await request.json());
	return apiSuccess(await beginLearnStudy({ ...body, userId: user.id }));
});
