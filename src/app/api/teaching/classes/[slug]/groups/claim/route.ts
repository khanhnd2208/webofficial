import type { NextRequest } from 'next/server';

import { claimGroupViewer, groupClaimSchema, parseWithAppError } from '@/features/teaching';
import { apiSuccess, withErrorHandling, withTeachingGroupBoard } from '@/lib/apiUtils';
import { assertScopedRateLimit } from '@/lib/inquiryRateLimit';

export const POST = withTeachingGroupBoard(withErrorHandling(async (request: NextRequest, context) => {
	const slug = String((await context!.params).slug);
	await assertScopedRateLimit(request, `teaching-group-claim:${slug}`, 5);
	const input = parseWithAppError(groupClaimSchema, await request.json());
	return apiSuccess(await claimGroupViewer(slug, input.enrollmentId));
}));
