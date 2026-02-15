import { NextResponse, type NextRequest } from 'next/server';

import dbConnect from '@/lib/dbConnect';
import Post from '@/models/Post';

const VALID_REACTIONS = ['like', 'love', 'fire', 'clap'] as const;
type ReactionType = (typeof VALID_REACTIONS)[number];

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ slug: string }> }
) {
	try {
		const { slug } = await params;

		const body = (await request.json()) as unknown;
		if (!body || typeof body !== 'object') {
			return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 });
		}

		const { reaction } = body as { reaction?: unknown };
		const reactionType = String(reaction ?? '').trim() as ReactionType;

		if (!VALID_REACTIONS.includes(reactionType)) {
			return NextResponse.json(
				{ ok: false, error: `Invalid reaction. Must be one of: ${VALID_REACTIONS.join(', ')}` },
				{ status: 400 }
			);
		}

		await dbConnect();

		const updated = await Post.findOneAndUpdate(
			{ slug: slug.trim().toLowerCase(), isPublished: true },
			{ $inc: { [`reactions.${reactionType}`]: 1 } },
			{ returnDocument: 'after', select: 'reactions' }
		).lean();

		if (!updated) {
			return NextResponse.json({ ok: false, error: 'Post not found' }, { status: 404 });
		}

		const reactions = {
			like: (updated as unknown as { reactions?: { like?: number } }).reactions?.like ?? 0,
			love: (updated as unknown as { reactions?: { love?: number } }).reactions?.love ?? 0,
			fire: (updated as unknown as { reactions?: { fire?: number } }).reactions?.fire ?? 0,
			clap: (updated as unknown as { reactions?: { clap?: number } }).reactions?.clap ?? 0,
		};

		return NextResponse.json({ ok: true, data: { reactions } });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}
