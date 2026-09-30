import {
	archiveTest,
	getAdminTest,
	parseWithAppError,
	updateTest,
	updateTestSchema,
} from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const GET = withAdmin(async (_request, _user, context) =>
	apiSuccess(await getAdminTest(String((await context!.params).id))),
);

export const PATCH = withAdmin(async (request: NextRequest, _user, context) =>
	apiSuccess(
		await updateTest(
			String((await context!.params).id),
			parseWithAppError(updateTestSchema, await request.json()),
		),
	),
);

export const DELETE = withAdmin(async (_request, _user, context) =>
	apiSuccess(await archiveTest(String((await context!.params).id))),
);
