import {
	deleteAdminRecallDeck,
	getAdminRecallDeck,
	updateActiveRecallDeckMetaSchema,
	updateActiveRecallDeckSchema,
	updateAdminRecallDeck,
	updateAdminRecallDeckMeta,
} from '@/features/active-recall';
import { apiSuccess, AppError, withAdmin } from '@/lib/apiUtils';
import { parseSchema } from '@/lib/validation/parse';

async function params(context?: { params: Promise<{ courseId: string; deckId: string }> }) {
	return context!.params;
}

async function requireCourseDeck(courseId: string, deckId: string) {
	const deck = await getAdminRecallDeck(deckId);
	if (!deck || deck.courseId !== courseId) {
		throw new AppError('Không tìm thấy bộ thẻ trong môn học này', 404, 'NOT_FOUND');
	}
	return deck;
}

export const GET = withAdmin(async (_request, _user, context) => {
	const { courseId, deckId } = await params(context);
	return apiSuccess(await requireCourseDeck(courseId, deckId));
});

export const PATCH = withAdmin(async (request, _user, context) => {
	const { courseId, deckId } = await params(context);
	await requireCourseDeck(courseId, deckId);
	const json: unknown = await request.json();
	if (json && typeof json === 'object' && 'cards' in json) {
		const body = parseSchema(updateActiveRecallDeckSchema, json);
		return apiSuccess(await updateAdminRecallDeck(deckId, { ...body, courseId }));
	}
	const body = parseSchema(updateActiveRecallDeckMetaSchema, json);
	return apiSuccess(await updateAdminRecallDeckMeta(deckId, body));
});

export const DELETE = withAdmin(async (_request, _user, context) => {
	const { courseId, deckId } = await params(context);
	await requireCourseDeck(courseId, deckId);
	return apiSuccess(await deleteAdminRecallDeck(deckId));
});
