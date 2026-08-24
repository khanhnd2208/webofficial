import { getAssignedVocabSet } from '@/features/my-class';
import { apiError, apiSuccess, AppError, withAuth } from '@/lib/apiUtils';
import { ScoreValidationError, submitGameScore, type ScoreBody } from '@/services/scoreService';

type Ctx = { params: Promise<{ courseSlug: string; setId: string }> };

export const POST = withAuth(async (request, user, ctx) => {
	const { courseSlug, setId } = await (ctx as Ctx).params;
	await getAssignedVocabSet(String(courseSlug), String(setId));

	let body: ScoreBody;
	try {
		body = await request.json();
	} catch {
		return apiError('Invalid JSON', 400);
	}

	try {
		const result = await submitGameScore(user, setId, body);
		return apiSuccess(result);
	} catch (error) {
		if (error instanceof ScoreValidationError) {
			if (error.message === 'Vocab set not found') return apiError(error.message, 404);
			if (error.message === 'Unknown game mode') return apiError(error.message, 400);
			return apiError(`Validation: ${error.message}`, 422);
		}
		throw new AppError('Failed to submit score', 500);
	}
});
