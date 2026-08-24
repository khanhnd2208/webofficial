import type { NextRequest } from 'next/server';

import { undoLatestGroupMove } from '@/features/teaching';
import { apiSuccess, withErrorHandling, withTeachingGroupBoard } from '@/lib/apiUtils';
import { assertScopedRateLimit } from '@/lib/inquiryRateLimit';

export const POST = withTeachingGroupBoard(withErrorHandling(async (request: NextRequest, context) => {
	const slug = String((await context!.params).slug);
	await assertScopedRateLimit(request, `teaching-group-undo:${slug}`, 10, 5 * 60 * 1000);
	return apiSuccess(await undoLatestGroupMove(slug));
}));
