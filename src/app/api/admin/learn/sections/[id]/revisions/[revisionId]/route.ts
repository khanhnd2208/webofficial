import { restoreSectionRevision } from '@/features/learn';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';

export const POST = withAdmin(async (_request, _user, context) => {
	const params = await context!.params;
	const sectionId = String(params.id);
	const revisionId = String(params.revisionId);
	return apiSuccess(await restoreSectionRevision(sectionId, revisionId));
});
