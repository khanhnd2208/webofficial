import { type NextRequest } from 'next/server';

import { myspaceTestsService, updateSpaceTestSchema } from '@/features/myspace-tests';
import { withAdmin, apiSuccess } from '@/lib/apiUtils';
import { parseSchema } from '@/lib/validation/parse';

export const GET = withAdmin(async (_request: NextRequest, _user, context) => {
	const { id } = await context!.params;
	const test = await myspaceTestsService.getAdminTest(String(id));
	return apiSuccess(test);
});

export const PATCH = withAdmin(async (request: NextRequest, _user, context) => {
	const { id } = await context!.params;
	const body: unknown = await request.json();
	const input = parseSchema(updateSpaceTestSchema, body);
	const test = await myspaceTestsService.updateTest(String(id), input);
	return apiSuccess(test);
});

export const DELETE = withAdmin(async (_request: NextRequest, _user, context) => {
	const { id } = await context!.params;
	await myspaceTestsService.deleteTest(String(id));
	return apiSuccess(null);
});
