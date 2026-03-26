import { withErrorHandling, apiSuccess } from '@/lib/apiUtils';
import { POST_CATEGORIES } from '@/models/Post';
import { getAllCategoriesAdmin } from '@/services/postService';

/**
 * GET /api/posts/categories
 * Returns:
 *   - predefined: the built-in category list
 *   - used: categories actually used by posts in the database
 */
export const GET = withErrorHandling(async () => {
	const used = await getAllCategoriesAdmin();
	return apiSuccess({
		predefined: [...POST_CATEGORIES],
		used,
	});
});
