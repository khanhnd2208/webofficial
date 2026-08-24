import { getAuthoringCourse } from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';

export const GET = withAdmin(async (_request, user, context) => {
	const { courseSlug } = await context!.params;
	return apiSuccess(await getAuthoringCourse(String(courseSlug), user.role));
});
