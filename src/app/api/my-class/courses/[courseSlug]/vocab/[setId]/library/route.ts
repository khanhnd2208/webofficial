import { addAssignedVocabToLibrary, getAssignedVocabLibraryState, getAssignedVocabSet } from '@/features/my-class';
import { apiSuccess, withAuth, withErrorHandling } from '@/lib/apiUtils';
import { getApiUser } from '@/lib/apiAuth';

type Ctx = { params: Promise<{ courseSlug: string; setId: string }> };

export const GET = withErrorHandling(async (request, context) => {
	const { courseSlug, setId } = await (context as Ctx).params;
	await getAssignedVocabSet(String(courseSlug), String(setId));
	const user = await getApiUser(request);
	return apiSuccess(await getAssignedVocabLibraryState(user?.id ?? null, String(setId)));
});

export const POST = withAuth(async (_request, user, context) => {
	const { courseSlug, setId } = await (context as Ctx).params;
	return apiSuccess(await addAssignedVocabToLibrary(user.id, String(courseSlug), String(setId)), 201);
});
