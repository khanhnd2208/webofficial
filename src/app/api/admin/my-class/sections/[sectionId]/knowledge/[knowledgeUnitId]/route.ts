import { detachKnowledgeUnit } from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';

export const DELETE = withAdmin(async (_request, _user, context) => {
	const params = await context!.params;
	return apiSuccess(await detachKnowledgeUnit(String(params.sectionId), String(params.knowledgeUnitId)));
});
