import { withErrorHandling, apiSuccess } from '@/lib/apiUtils';
import { getAllTags } from '@/services/postService';

export const GET = withErrorHandling(async () => {
	const tags = await getAllTags();
	return apiSuccess(tags);
});
