import { getSectionRevision, restoreSectionRevision } from '@/features/learn';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';

export const GET = withAdmin(async (_request, _user, context) => {
	const params = await context!.params;
	return apiSuccess(await getSectionRevision(String(params.id), String(params.revisionId)));
});

export const POST = withAdmin(async (_request, _user, context) => {
	const params = await context!.params;
	const sectionId = String(params.id);
	const revisionId = String(params.revisionId);
	return apiSuccess(await restoreSectionRevision(sectionId, revisionId));
});
