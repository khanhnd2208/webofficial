import { parseWithAppError, submitTest, submitTestSchema } from '@/features/my-class';
import { resolveMyClassActor } from '@/features/my-class/services/resolveActor';
import { apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const POST = withErrorHandling(async (request: NextRequest, context) => {
	const { courseSlug, testSlug } = await context!.params;
	const body = parseWithAppError(submitTestSchema, await request.json());
	const actor = await resolveMyClassActor(request, { ensureGuest: true });
	return apiSuccess(
		await submitTest(String(courseSlug), String(testSlug), body, {
			userId: actor.type === 'user' ? actor.userId : null,
			guestId: actor.type === 'guest' ? actor.guestId : null,
		}),
	);
});
