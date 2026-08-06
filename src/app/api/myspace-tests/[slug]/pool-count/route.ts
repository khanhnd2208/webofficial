import { type NextRequest } from 'next/server';

import { myspaceTestsService, playPoolFiltersSchema } from '@/features/myspace-tests';
import { withErrorHandling, apiSuccess } from '@/lib/apiUtils';
import { parseSchema } from '@/shared/validation/parse';

export const POST = withErrorHandling(async (request: NextRequest, context) => {
	const { slug } = await context!.params;
	const body: unknown = await request.json().catch(() => ({}));
	const filters = parseSchema(playPoolFiltersSchema, body ?? {});
	const result = await myspaceTestsService.countPlayPool(String(slug), filters);
	return apiSuccess(result);
});
