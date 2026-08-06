import { type NextRequest } from 'next/server';

import { myspaceTestsService } from '@/features/myspace-tests';
import { withErrorHandling, apiSuccess } from '@/lib/apiUtils';

export const POST = withErrorHandling(async (_request: NextRequest, context) => {
	const { slug } = await context!.params;
	const session = await myspaceTestsService.startSession(String(slug));
	return apiSuccess(session, 201);
});
