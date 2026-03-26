import { type NextRequest } from 'next/server';

import { withErrorHandling, apiSuccess, apiError } from '@/lib/apiUtils';
import dbConnect from '@/lib/dbConnect';
import Post from '@/models/Post';

export const POST = withErrorHandling(async (_request: NextRequest, context) => {
	const { slug } = await context!.params;

	await dbConnect();

	const updated = await Post.findOneAndUpdate(
		{ slug: slug.trim().toLowerCase(), isPublished: true },
		{ $inc: { views: 1 } },
		{ returnDocument: 'after', select: 'views' }
	).lean();

	if (!updated) {
		return apiError('Post not found', 404);
	}

	const views = (updated as unknown as { views?: number }).views ?? 0;
	return apiSuccess({ views });
});
