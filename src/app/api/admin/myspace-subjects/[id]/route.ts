import { type NextRequest } from 'next/server';

import { myspaceTestsService, updateSubjectSchema } from '@/features/myspace-tests';
import { withAdmin, apiSuccess } from '@/lib/apiUtils';
import { parseSchema } from '@/shared/validation/parse';

export const PATCH = withAdmin(async (request: NextRequest, _user, context) => {
	const { id } = await context!.params;
	const body: unknown = await request.json();
	const input = parseSchema(updateSubjectSchema, body);
	const subject = await myspaceTestsService.updateSubject(String(id), input);
	return apiSuccess(subject);
});

export const DELETE = withAdmin(async (_request: NextRequest, _user, context) => {
	const { id } = await context!.params;
	await myspaceTestsService.deleteSubject(String(id));
	return apiSuccess(null);
});
