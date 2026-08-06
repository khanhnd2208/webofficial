import { type NextRequest } from 'next/server';

import { myspaceTestsService, startSessionSchema } from '@/features/myspace-tests';
import { withErrorHandling, apiSuccess } from '@/lib/apiUtils';
import { parseSchema } from '@/shared/validation/parse';

export const POST = withErrorHandling(async (request: NextRequest, context) => {
	const { slug } = await context!.params;
	const raw: unknown = await request.json().catch(() => ({}));
	const body = raw && typeof raw === 'object' ? raw : {};
	const input = parseSchema(startSessionSchema, body);
	const session = await myspaceTestsService.startSession(String(slug), input);
	return apiSuccess(session, 201);
});
