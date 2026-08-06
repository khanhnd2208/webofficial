import { myspaceTestsService } from '@/features/myspace-tests';
import { withErrorHandling, apiSuccess } from '@/lib/apiUtils';

export const GET = withErrorHandling(async () => {
	const items = await myspaceTestsService.listPublishedTests();
	return apiSuccess({ items });
});
