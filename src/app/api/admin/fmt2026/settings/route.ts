import { settingsUpdateSchema } from '@/features/fmt2026/schemas';
import { getAdminOverview, updateSettings } from '@/features/fmt2026/services/drawService';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { parseSchema } from '@/lib/validation/parse';

export const PATCH = withAdmin(async (request) => {
	await updateSettings(parseSchema(settingsUpdateSchema, await request.json()));
	return apiSuccess(await getAdminOverview());
});
