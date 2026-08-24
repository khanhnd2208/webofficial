import { getTest } from '@/features/my-class';
import { resolveMyClassActorOptional } from '@/features/my-class/services/resolveActor';
import { apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const GET = withErrorHandling(async (request: NextRequest, context) => {
	const { courseSlug, testSlug } = await context!.params;
	const actor = await resolveMyClassActorOptional(request);
	return apiSuccess(
		await getTest(String(courseSlug), String(testSlug), {
			userId: actor?.type === 'user' ? actor.userId : null,
			guestId: actor?.type === 'guest' ? actor.guestId : null,
		}),
	);
});
