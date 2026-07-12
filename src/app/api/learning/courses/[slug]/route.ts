import { type NextRequest } from 'next/server';

import { learningService } from '@/features/progress';
import { withAuth, apiSuccess } from '@/lib/apiUtils';

export const GET = withAuth(async (_request: NextRequest, user, context) => {
	const { slug } = await context!.params;
	const course = await learningService.getLearnerCourse(user.id, String(slug));
	return apiSuccess(course);
});
