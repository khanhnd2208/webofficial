import { submitLearnQuiz, submitLearnQuizSchema } from '@/features/learn';
import { apiSuccess, withAuth } from '@/lib/apiUtils';
import { parseSchema } from '@/shared/validation/parse';

export const POST = withAuth(async (request, user, context) => {
	const sectionId = String((await context!.params).id);
	const { answers } = parseSchema(submitLearnQuizSchema, await request.json());
	return apiSuccess(
		await submitLearnQuiz(sectionId, { userId: user.id, isAdmin: user.role === 'admin' }, answers),
	);
});
