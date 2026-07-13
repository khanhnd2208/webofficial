import { type NextRequest } from 'next/server';

import { createInquirySchema } from '@/features/inquiries/schemas';
import { apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { assertInquiryRateLimit } from '@/lib/inquiryRateLimit';
import { createInquiry } from '@/services/inquiryService';
import { parseSchema } from '@/shared/validation/parse';

export const POST = withErrorHandling(async (request: NextRequest) => {
	const body: unknown = await request.json();
	const parsed = parseSchema(createInquirySchema, body);

	// Honeypot — silently accept without persisting (anti-spam).
	if (parsed.website?.trim()) {
		return apiSuccess({ accepted: true }, 201);
	}

	await assertInquiryRateLimit(request);

	const { website: _honeypot, ...input } = parsed;
	const inquiry = await createInquiry(input);

	return apiSuccess({ id: inquiry.id, status: inquiry.status }, 201);
});
