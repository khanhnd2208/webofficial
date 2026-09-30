import {
	createActiveRecallDeckSchema,
	listAdminRecallDecks,
	createAdminRecallDeck,
} from '@/features/active-recall';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { parseSchema } from '@/lib/validation/parse';

export const GET = withAdmin(async () => apiSuccess(await listAdminRecallDecks()));

export const POST = withAdmin(async (request) => {
	const body = parseSchema(createActiveRecallDeckSchema, await request.json());
	return apiSuccess(await createAdminRecallDeck(body), 201);
});
