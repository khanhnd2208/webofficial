import { type NextRequest } from 'next/server';

import { myspaceTestsService } from '@/features/myspace-tests';
import { resolvePlayActor } from '@/features/myspace-tests/resolvePlayActor';
import { withErrorHandling, apiSuccess } from '@/lib/apiUtils';

export const GET = withErrorHandling(async (request: NextRequest) => {
	const actor = await resolvePlayActor(request);
	const items = await myspaceTestsService.listPublishedTests(actor);
	return apiSuccess({ items });
});
