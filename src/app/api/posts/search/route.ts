import { type NextRequest } from 'next/server';

import { withErrorHandling, apiSuccess } from '@/lib/apiUtils';
import dbConnect from '@/lib/dbConnect';
import Post from '@/models/Post';

export const GET = withErrorHandling(async (request: NextRequest) => {
	const url = new URL(request.url);
	const q = url.searchParams.get('q')?.trim();

	if (!q || q.length < 2) {
		return apiSuccess([]);
	}

	await dbConnect();

	// Use MongoDB text index for fast search (indexes on title, summary, tags)
	const items = await Post.find(
		{ isPublished: true, $text: { $search: q } },
		{ score: { $meta: 'textScore' } },
	)
		.select('title slug summary tags chapterNumber')
		.sort({ score: { $meta: 'textScore' } })
		.limit(10)
		.lean();

	const results = (
		items as unknown as {
			_id: unknown;
			title: string;
			slug: string;
			summary: string;
			tags: string[];
			chapterNumber?: number;
		}[]
	).map((doc) => ({
		id: String(doc._id),
		title: doc.title,
		slug: doc.slug,
		summary: doc.summary,
		tags: Array.isArray(doc.tags) ? doc.tags : [],
		chapterNumber: doc.chapterNumber ?? undefined,
	}));

	return apiSuccess(results);
});
