import { type NextRequest } from 'next/server';

import { myspaceTestsService, submitSessionSchema } from '@/features/myspace-tests';
import { resolvePlayActor } from '@/features/myspace-tests/resolvePlayActor';
import { withErrorHandling, apiSuccess } from '@/lib/apiUtils';
import { parseSchema } from '@/lib/validation/parse';

export const POST = withErrorHandling(async (request: NextRequest, context) => {
	const { slug, sessionId } = await context!.params;
	const body: unknown = await request.json();
	const input = parseSchema(submitSessionSchema, body);
	const actor = await resolvePlayActor(request);
	const result = await myspaceTestsService.submitSession(
		String(slug),
		String(sessionId),
		input,
		actor,
	);
	return apiSuccess(result);
});
