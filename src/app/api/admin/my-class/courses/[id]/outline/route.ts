import { getAdminCourseOutline } from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';

export const GET = withAdmin(async (_request, _user, context) =>
	apiSuccess(await getAdminCourseOutline(String((await context!.params).id))),
);
