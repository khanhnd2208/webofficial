import { parseWithAppError, setTestQuestions, testQuestionsSchema } from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const PUT = withAdmin(async (request: NextRequest, _user, context) => {
	const body = parseWithAppError(testQuestionsSchema, await request.json());
	const items = body.items ?? (body.questionIds ?? []).map((questionId) => ({ questionId }));
	return apiSuccess(await setTestQuestions(String((await context!.params).id), items));
});
