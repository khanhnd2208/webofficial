import { prizeCreateSchema } from '@/features/fmt2026/schemas';
import { createPrize } from '@/features/fmt2026/services/drawService';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { parseSchema } from '@/lib/validation/parse';

export const POST = withAdmin(async (request) => {
	const input = parseSchema(prizeCreateSchema, await request.json());
	return apiSuccess(await createPrize(input), 201);
});
