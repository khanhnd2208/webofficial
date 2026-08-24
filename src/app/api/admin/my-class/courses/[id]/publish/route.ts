import { publishAdminCourse, validateAdminCoursePublish } from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';

export const GET = withAdmin(async (_request, _user, context) =>
	apiSuccess(await validateAdminCoursePublish(String((await context!.params).id))),
);

export const POST = withAdmin(async (_request, _user, context) =>
	apiSuccess(await publishAdminCourse(String((await context!.params).id))),
);
