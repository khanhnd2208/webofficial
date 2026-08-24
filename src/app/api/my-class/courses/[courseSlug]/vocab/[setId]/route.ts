import { getAssignedVocabSet } from '@/features/my-class';
import { apiSuccess, withErrorHandling } from '@/lib/apiUtils';

export const GET = withErrorHandling(async (_request, context) => {
	const { courseSlug, setId } = await context!.params;
	return apiSuccess(await getAssignedVocabSet(String(courseSlug), String(setId)));
});
