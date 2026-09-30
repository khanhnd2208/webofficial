import { type NextRequest } from 'next/server';

import { createInquirySchema } from '@/features/inquiries/schemas';
import { getApiUser } from '@/lib/apiAuth';
import { apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { assertInquiryAvailable } from '@/lib/inquiryAvailability';
import { assertInquiryRateLimit } from '@/lib/inquiryRateLimit';
import { createInquiry } from '@/services/inquiryService';
import { parseSchema } from '@/lib/validation/parse';

export const POST = withErrorHandling(async (request: NextRequest) => {
	const body: unknown = await request.json();
	const parsed = parseSchema(createInquirySchema, body);

	// Honeypot — silently accept without persisting (anti-spam).
	if (parsed.website?.trim()) {
		return apiSuccess({ accepted: true }, 201);
	}

	assertInquiryAvailable();
	await assertInquiryRateLimit(request);
	const user = await getApiUser(request);

	const { website: _honeypot, ...input } = parsed;
	const inquiry = await createInquiry(
		{
			...input,
			// Account email is server-authoritative; a client payload cannot spoof it.
			email: user?.email ?? input.email,
		},
		user
			? { submitterType: 'account', submittedByUserId: user.id || undefined }
			: { submitterType: 'guest' },
	);

	return apiSuccess({ id: inquiry.id, status: inquiry.status }, 201);
});
