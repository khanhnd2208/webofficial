import { type NextRequest } from 'next/server';

import { listInquiriesQuerySchema } from '@/features/inquiries/schemas';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { listInquiries } from '@/services/inquiryService';
import { parseSchema } from '@/shared/validation/parse';

export const GET = withAdmin(async (request: NextRequest) => {
	const url = new URL(request.url);
	const query = parseSchema(listInquiriesQuerySchema, {
		page: url.searchParams.get('page') ?? '1',
		limit: url.searchParams.get('limit') ?? '20',
		status: url.searchParams.get('status') ?? undefined,
		inquiryType: url.searchParams.get('inquiryType') ?? undefined,
		search: url.searchParams.get('search') ?? undefined,
		dateFrom: url.searchParams.get('dateFrom') ?? undefined,
		dateTo: url.searchParams.get('dateTo') ?? undefined,
	});

	const result = await listInquiries(query);
	return apiSuccess(result);
});
