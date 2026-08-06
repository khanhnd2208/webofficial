import { myspaceTestsService } from '@/features/myspace-tests';
import { withAdmin, apiSuccess } from '@/lib/apiUtils';

export const GET = withAdmin(async () => {
	const meta = await myspaceTestsService.getFilterMeta();
	return apiSuccess(meta);
});
