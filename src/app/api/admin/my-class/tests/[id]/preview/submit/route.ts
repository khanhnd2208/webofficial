import { parseWithAppError, submitAdminPreviewTest, submitTestSchema } from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const POST = withAdmin(async (request: NextRequest, _user, context) =>
	apiSuccess(
		await submitAdminPreviewTest(
			String((await context!.params).id),
			parseWithAppError(submitTestSchema, await request.json()),
		),
	),
);
