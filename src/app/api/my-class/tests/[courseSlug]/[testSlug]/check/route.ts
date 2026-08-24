import { checkTestQuestion, checkTestQuestionSchema, parseWithAppError } from '@/features/my-class';
import { apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const POST = withErrorHandling(async (request: NextRequest, context) => {
	const { courseSlug, testSlug } = await context!.params;
	const body = parseWithAppError(checkTestQuestionSchema, await request.json());
	return apiSuccess(await checkTestQuestion(String(courseSlug), String(testSlug), body));
});
