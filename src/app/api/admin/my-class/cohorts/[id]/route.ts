import { archiveCohort, getAdminCohort, parseWithAppError, updateCohort, updateCohortSchema } from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const GET = withAdmin(async (_request, _user, context) =>
	apiSuccess(await getAdminCohort(String((await context!.params).id))),
);

export const PATCH = withAdmin(async (request: NextRequest, _user, context) =>
	apiSuccess(
		await updateCohort(String((await context!.params).id), parseWithAppError(updateCohortSchema, await request.json())),
	),
);

export const DELETE = withAdmin(async (_request, _user, context) =>
	apiSuccess(await archiveCohort(String((await context!.params).id))),
);
