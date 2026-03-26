import { type NextRequest } from 'next/server';

import { withErrorHandling, apiSuccess, apiError } from '@/lib/apiUtils';
import { getPostBySlug } from '@/services/postService';

export const GET = withErrorHandling(async (_request: NextRequest, context) => {
	const { slug } = await context!.params;
	const post = await getPostBySlug(slug);
	if (!post) return apiError('Not found', 404);
	return apiSuccess(post);
});
