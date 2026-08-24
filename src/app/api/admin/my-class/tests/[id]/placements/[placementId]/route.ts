import { deleteTestPlacement } from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';

export const DELETE = withAdmin(async (_request, _user, context) => {
	const params = await context!.params;
	return apiSuccess(await deleteTestPlacement(String(params.id), String(params.placementId)));
});
