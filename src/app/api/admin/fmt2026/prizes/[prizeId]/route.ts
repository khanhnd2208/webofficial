import { prizeUpdateSchema } from '@/features/fmt2026/schemas';
import { updatePrize } from '@/features/fmt2026/services/drawService';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { parseSchema } from '@/lib/validation/parse';

export const PATCH = withAdmin(async (request, _user, context) => {
	const prizeId = String((await context!.params).prizeId);
	const input = parseSchema(prizeUpdateSchema, await request.json());
	return apiSuccess(await updatePrize(prizeId, input));
});
