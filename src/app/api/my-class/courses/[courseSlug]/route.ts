import { getCourse } from '@/features/my-class';
import { apiSuccess, withErrorHandling } from '@/lib/apiUtils';

export const GET = withErrorHandling(async (_request, context) => {
	const { courseSlug } = await context!.params;
	return apiSuccess(await getCourse(String(courseSlug)));
});
