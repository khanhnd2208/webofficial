import { NextResponse } from 'next/server';

import { POST_CATEGORIES } from '@/models/Post';
import { getAllCategoriesAdmin } from '@/services/postService';

/**
 * GET /api/posts/categories
 * Returns:
 *   - predefined: the built-in category list
 *   - used: categories actually used by posts in the database
 */
export async function GET() {
	try {
		const used = await getAllCategoriesAdmin();
		return NextResponse.json({
			ok: true,
			data: {
				predefined: [...POST_CATEGORIES],
				used,
			},
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ ok: false, error: message }, { status: 500 });
	}
}
