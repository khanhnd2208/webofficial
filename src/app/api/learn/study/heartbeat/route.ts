import { heartbeatLearnStudy, heartbeatLearnStudySchema } from '@/features/learn';
import { apiSuccess, withAuth } from '@/lib/apiUtils';
import { parseSchema } from '@/shared/validation/parse';

export const POST = withAuth(async (request, user) => {
	const body = parseSchema(heartbeatLearnStudySchema, await request.json());
	return apiSuccess(await heartbeatLearnStudy({ ...body, userId: user.id }));
});
