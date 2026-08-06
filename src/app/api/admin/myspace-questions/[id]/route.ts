import { type NextRequest } from 'next/server';

import { myspaceTestsService, updateMcqQuestionSchema } from '@/features/myspace-tests';
import { withAdmin, apiSuccess } from '@/lib/apiUtils';
import { parseSchema } from '@/shared/validation/parse';

export const GET = withAdmin(async (_request: NextRequest, _user, context) => {
	const { id } = await context!.params;
	const question = await myspaceTestsService.getQuestion(String(id));
	return apiSuccess(question);
});

export const PATCH = withAdmin(async (request: NextRequest, _user, context) => {
	const { id } = await context!.params;
	const body: unknown = await request.json();
	const input = parseSchema(updateMcqQuestionSchema, body);
	const question = await myspaceTestsService.updateQuestion(String(id), input);
	return apiSuccess(question);
});

export const DELETE = withAdmin(async (_request: NextRequest, _user, context) => {
	const { id } = await context!.params;
	await myspaceTestsService.deleteQuestion(String(id));
	return apiSuccess(null);
});
