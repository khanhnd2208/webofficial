/* ════════════════════════════════════════════════════════════════════════
   POST /api/vocab-sets/[id]/score
   Submit a completed game session. The server re-calculates the score
   from raw timestamps (anti-cheat). Only saves if new score > best.
   ════════════════════════════════════════════════════════════════════════ */
import { withAuth, apiSuccess, apiError, AppError } from '@/lib/apiUtils';
import {
	ScoreValidationError,
	submitGameScore,
	type ScoreBody,
} from '@/services/scoreService';

type Ctx = { params: Promise<{ id: string }> };

export const POST = withAuth(async (request, user, ctx) => {
	const { id: vocabSetId } = await (ctx as Ctx).params;

	let body: ScoreBody;
	try {
		body = await request.json();
	} catch {
		return apiError('Invalid JSON', 400);
	}

	try {
		const result = await submitGameScore(user, vocabSetId, body);
		return apiSuccess(result);
	} catch (error) {
		if (error instanceof ScoreValidationError) {
			if (error.message === 'Vocab set not found') {
				return apiError(error.message, 404);
			}
			if (error.message === 'Unknown game mode') {
				return apiError(error.message, 400);
			}
			return apiError(`Validation: ${error.message}`, 422);
		}
		throw new AppError('Failed to submit score', 500);
	}
});
