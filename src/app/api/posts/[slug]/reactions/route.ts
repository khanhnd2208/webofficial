import { type NextRequest } from 'next/server';

import { withErrorHandling, apiSuccess, apiError } from '@/lib/apiUtils';
import dbConnect from '@/lib/dbConnect';
import Post from '@/models/Post';

const VALID_REACTIONS = ['like', 'love', 'fire', 'clap'] as const;
type ReactionType = (typeof VALID_REACTIONS)[number];

export const POST = withErrorHandling(async (request: NextRequest, context) => {
	const { slug } = await context!.params;

	const body = (await request.json()) as unknown;
	if (!body || typeof body !== 'object') {
		return apiError('Invalid body', 400);
	}

	const { reaction } = body as { reaction?: unknown };
	const reactionType = String(reaction ?? '').trim() as ReactionType;

	if (!VALID_REACTIONS.includes(reactionType)) {
		return apiError(`Invalid reaction. Must be one of: ${VALID_REACTIONS.join(', ')}`, 400);
	}

	await dbConnect();

	const updated = await Post.findOneAndUpdate(
		{ slug: slug.trim().toLowerCase(), isPublished: true },
		{ $inc: { [`reactions.${reactionType}`]: 1 } },
		{ returnDocument: 'after', select: 'reactions' },
	).lean();

	if (!updated) {
		return apiError('Post not found', 404);
	}

	const reactions = {
		like: (updated as unknown as { reactions?: { like?: number } }).reactions?.like ?? 0,
		love: (updated as unknown as { reactions?: { love?: number } }).reactions?.love ?? 0,
		fire: (updated as unknown as { reactions?: { fire?: number } }).reactions?.fire ?? 0,
		clap: (updated as unknown as { reactions?: { clap?: number } }).reactions?.clap ?? 0,
	};

	return apiSuccess({ reactions });
});
