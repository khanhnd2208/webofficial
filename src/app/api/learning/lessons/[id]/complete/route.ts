import { type NextRequest } from 'next/server';

import { learningService } from '@/features/progress';
import { withAuth, apiSuccess } from '@/lib/apiUtils';

export const POST = withAuth(async (_request: NextRequest, user, context) => {
	const { id } = await context!.params;
	const result = await learningService.completeLearnerLesson(user.id, String(id));
	return apiSuccess(result);
});
