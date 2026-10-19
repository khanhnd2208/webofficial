import { type NextRequest } from 'next/server';

import { feedbackSubmissionSchema } from '@/features/unreleased-gift/domain/submission';
import { recordFeedback } from '@/features/unreleased-gift/services/feedbackService';
import { apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { assertScopedRateLimit } from '@/lib/inquiryRateLimit';
import { parseSchema } from '@/lib/validation/parse';

export const POST = withErrorHandling(async (request: NextRequest) => {
	const body: unknown = await request.json();
	const input = parseSchema(feedbackSubmissionSchema, body);
	await assertScopedRateLimit(request, 'unreleased-gift', 5);
	const created = await recordFeedback(input);
	return apiSuccess(created, 201);
});
