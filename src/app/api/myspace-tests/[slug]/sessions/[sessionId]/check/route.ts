import { type NextRequest } from 'next/server';

import { checkAnswerSchema, myspaceTestsService } from '@/features/myspace-tests';
import { withErrorHandling, apiSuccess } from '@/lib/apiUtils';
import { parseSchema } from '@/shared/validation/parse';

export const POST = withErrorHandling(async (request: NextRequest, context) => {
	const { slug, sessionId } = await context!.params;
	const body: unknown = await request.json();
	const input = parseSchema(checkAnswerSchema, body);
	const result = await myspaceTestsService.checkAnswer(
		String(slug),
		String(sessionId),
		input,
	);
	return apiSuccess(result);
});
