import { NextResponse, type NextRequest } from 'next/server';

import dbConnect from '@/lib/dbConnect';
import Post from '@/models/Post';

export async function POST(
	_request: NextRequest,
	{ params }: { params: Promise<{ slug: string }> }
) {
	try {
		const { slug } = await params;

		await dbConnect();

		const updated = await Post.findOneAndUpdate(
			{ slug: slug.trim().toLowerCase(), isPublished: true },
			{ $inc: { views: 1 } },
			{ returnDocument: 'after', select: 'views' }
		).lean();

		if (!updated) {
			return NextResponse.json({ ok: false, error: 'Post not found' }, { status: 404 });
		}

		const views = (updated as unknown as { views?: number }).views ?? 0;
		return NextResponse.json({ ok: true, data: { views } });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}
