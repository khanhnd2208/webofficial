import {
	deleteAdminRecallDeck,
	getAdminRecallDeck,
	updateActiveRecallDeckMetaSchema,
	updateActiveRecallDeckSchema,
	updateAdminRecallDeck,
	updateAdminRecallDeckMeta,
} from '@/features/active-recall';
import { apiSuccess, AppError, withAdmin } from '@/lib/apiUtils';
import { parseSchema } from '@/shared/validation/parse';

export const GET = withAdmin(async (_request, _user, context) => {
	const id = String((await context!.params).id);
	const deck = await getAdminRecallDeck(id);
	if (!deck) throw new AppError('Không tìm thấy bộ thẻ', 404);
	return apiSuccess(deck);
});

export const PATCH = withAdmin(async (request, _user, context) => {
	const id = String((await context!.params).id);
	const json: unknown = await request.json();
	if (json && typeof json === 'object' && 'cards' in json) {
		const body = parseSchema(updateActiveRecallDeckSchema, json);
		return apiSuccess(await updateAdminRecallDeck(id, body));
	}
	const body = parseSchema(updateActiveRecallDeckMetaSchema, json);
	return apiSuccess(await updateAdminRecallDeckMeta(id, body));
});

export const DELETE = withAdmin(async (_request, _user, context) => {
	const id = String((await context!.params).id);
	return apiSuccess(await deleteAdminRecallDeck(id));
});
