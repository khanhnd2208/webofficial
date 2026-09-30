import {
	archiveQuestion,
	getAdminQuestion,
	parseWithAppError,
	questionBodySchema,
	updateQuestion,
} from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const GET = withAdmin(async (_request, _user, context) =>
	apiSuccess(await getAdminQuestion(String((await context!.params).id))),
);

export const PATCH = withAdmin(async (request: NextRequest, _user, context) =>
	apiSuccess(
		await updateQuestion(
			String((await context!.params).id),
			parseWithAppError(questionBodySchema, await request.json()),
		),
	),
);

export const DELETE = withAdmin(async (_request, _user, context) =>
	apiSuccess(await archiveQuestion(String((await context!.params).id))),
);
