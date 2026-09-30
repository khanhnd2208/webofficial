import { type NextRequest } from 'next/server';

import { updateInquirySchema } from '@/features/inquiries/schemas';
import { apiError, apiSuccess, withAdmin } from '@/lib/apiUtils';
import { deleteInquiry, getInquiry, updateInquiry } from '@/services/inquiryService';
import { parseSchema } from '@/lib/validation/parse';

export const GET = withAdmin(async (_request: NextRequest, _user, context) => {
	const { id } = await context!.params;
	const inquiry = await getInquiry(id);
	if (!inquiry) return apiError('Not found', 404);
	return apiSuccess(inquiry);
});

export const PATCH = withAdmin(async (request: NextRequest, _user, context) => {
	const { id } = await context!.params;
	const body: unknown = await request.json();
	const input = parseSchema(updateInquirySchema, body);
	const updated = await updateInquiry(id, input);
	return apiSuccess(updated);
});

export const DELETE = withAdmin(async (_request: NextRequest, _user, context) => {
	const { id } = await context!.params;
	await deleteInquiry(id);
	return apiSuccess({ id });
});
