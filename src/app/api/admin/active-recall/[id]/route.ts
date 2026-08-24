import { archiveAdminRecallDeck, getAdminRecallDeck, updateActiveRecallDeckSchema, updateAdminRecallDeck } from '@/features/active-recall';
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
	const body = parseSchema(updateActiveRecallDeckSchema, await request.json());
	return apiSuccess(await updateAdminRecallDeck(id, body));
});

export const DELETE = withAdmin(async (_request, _user, context) => {
	const id = String((await context!.params).id);
	await archiveAdminRecallDeck(id);
	return apiSuccess({ archived: true });
});
