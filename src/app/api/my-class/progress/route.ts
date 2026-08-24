import { getActorProgress } from '@/features/my-class';
import { resolveMyClassActorOptional } from '@/features/my-class/services/resolveActor';
import { apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const GET = withErrorHandling(async (request: NextRequest) => {
	const actor = await resolveMyClassActorOptional(request);
	const courseSlug = request.nextUrl.searchParams.get('courseSlug') ?? undefined;
	if (courseSlug) {
		return apiSuccess(await getActorProgress(actor, courseSlug));
	}
	return apiSuccess(await getActorProgress(actor));
});
