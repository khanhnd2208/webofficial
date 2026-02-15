import { NextResponse, type NextRequest } from 'next/server';

import dbConnect from '@/lib/dbConnect';
import Post from '@/models/Post';

export async function GET(request: NextRequest) {
	try {
		const url = new URL(request.url);
		const q = url.searchParams.get('q')?.trim();

		if (!q || q.length < 2) {
			return NextResponse.json({ ok: true, data: [] });
		}

		await dbConnect();

		// Use MongoDB text index for fast search (indexes on title, summary, tags)
		const items = await Post.find(
			{ isPublished: true, $text: { $search: q } },
			{ score: { $meta: 'textScore' } }
		)
			.select('title slug summary tags')
			.sort({ score: { $meta: 'textScore' } })
			.limit(10)
			.lean();

		const results = (items as unknown as { _id: unknown; title: string; slug: string; summary: string; tags: string[] }[]).map((doc) => ({
			id: String(doc._id),
			title: doc.title,
			slug: doc.slug,
			summary: doc.summary,
			tags: Array.isArray(doc.tags) ? doc.tags : [],
		}));

		return NextResponse.json({ ok: true, data: results });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 400 });
	}
}
