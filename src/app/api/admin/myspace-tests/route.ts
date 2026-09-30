import { type NextRequest } from 'next/server';

import { createSpaceTestSchema, myspaceTestsService } from '@/features/myspace-tests';
import { withAdmin, apiSuccess } from '@/lib/apiUtils';
import { parseSchema } from '@/lib/validation/parse';

export const GET = withAdmin(async () => {
	const items = await myspaceTestsService.listAdminTests();
	return apiSuccess({ items });
});

export const POST = withAdmin(async (request: NextRequest) => {
	const body: unknown = await request.json();
	const input = parseSchema(createSpaceTestSchema, body);
	const test = await myspaceTestsService.createTest(input);
	return apiSuccess(test, 201);
});
