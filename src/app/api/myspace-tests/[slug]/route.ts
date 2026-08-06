import { type NextRequest } from 'next/server';

import { myspaceTestsService } from '@/features/myspace-tests';
import { withErrorHandling, apiSuccess } from '@/lib/apiUtils';

export const GET = withErrorHandling(async (_request: NextRequest, context) => {
	const { slug } = await context!.params;
	const test = await myspaceTestsService.getPublishedTestBySlug(String(slug));
	return apiSuccess(test);
});
