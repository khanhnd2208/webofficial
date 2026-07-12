import { learningService } from '@/features/progress';
import { withAuth, apiSuccess } from '@/lib/apiUtils';

export const GET = withAuth(async (_request, user) => {
	const items = await learningService.listLearnerCourses(user.id);
	return apiSuccess({ items });
});
