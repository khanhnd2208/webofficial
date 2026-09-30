import { parseWithAppError, publishRevision, publishRevisionSchema } from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const POST = withAdmin(async (request: NextRequest, _user, context) => {
	const body = parseWithAppError(publishRevisionSchema, await request.json());
	return apiSuccess(
		await publishRevision(
			String((await context!.params).id),
			body.expectedUpdatedAt,
			Boolean(body.requireBoth),
		),
	);
});
