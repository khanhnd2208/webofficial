import { createSectionRevision, listSectionRevisions } from '@/features/learn';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';

export const GET = withAdmin(async (_request, _user, context) => {
	const id = String((await context!.params).id);
	return apiSuccess(await listSectionRevisions(id));
});

export const POST = withAdmin(async (_request, _user, context) => {
	const id = String((await context!.params).id);
	return apiSuccess(await createSectionRevision(id));
});
