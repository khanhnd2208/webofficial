import {
	activeRecallImportSchema,
	getAdminRecallDeck,
	importAdminRecallCards,
	previewAdminRecallImport,
} from '@/features/active-recall';
import { apiSuccess, AppError, withAdmin } from '@/lib/apiUtils';
import { parseSchema } from '@/shared/validation/parse';

export const POST = withAdmin(async (request, _user, context) => {
	const { courseId, deckId } = await context!.params;
	const deck = await getAdminRecallDeck(String(deckId));
	if (!deck || deck.courseId !== String(courseId)) {
		throw new AppError('Không tìm thấy bộ thẻ trong môn học này', 404, 'NOT_FOUND');
	}
	const requestedMode = request.nextUrl.searchParams.get('mode');
	const body = parseSchema(activeRecallImportSchema, {
		...(await request.json()),
		...(requestedMode ? { mode: requestedMode } : {}),
	});
	if (request.nextUrl.searchParams.get('dryRun') === '1') {
		return apiSuccess(await previewAdminRecallImport(deck.id, body.text, body.mode));
	}
	return apiSuccess(await importAdminRecallCards(deck.id, body));
});
