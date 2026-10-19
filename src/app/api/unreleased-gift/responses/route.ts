import { type NextRequest } from 'next/server';

import { feedbackSubmissionSchema } from '@/features/unreleased-gift/domain/submission';
import { recordFeedback } from '@/features/unreleased-gift/services/feedbackService';
import { apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { assertScopedRateLimit } from '@/lib/inquiryRateLimit';
import { parseSchema } from '@/lib/validation/parse';

/**
 * A workshop room often shares one campus address. The contact form's limit of
 * five would lock the rest of the room out; this still stops a scripted flood.
 */
const SUBMISSIONS_PER_WINDOW = 300;

export const POST = withErrorHandling(async (request: NextRequest) => {
	const body: unknown = await request.json();
	const input = parseSchema(feedbackSubmissionSchema, body);
	await assertScopedRateLimit(request, 'unreleased-gift', SUBMISSIONS_PER_WINDOW);
	const created = await recordFeedback(input);
	return apiSuccess(created, 201);
});
