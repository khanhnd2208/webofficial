import {
	deleteTutorial,
	parseWithAppError,
	updateTutorial,
	updateTutorialSchema,
} from '@/features/teaching';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import type { NextRequest } from 'next/server';

async function tutorialId(context?: { params: Promise<{ tutorialId: string }> }) {
	return String((await context!.params).tutorialId);
}

export const PATCH = withAdmin(async (request: NextRequest, _user, context) =>
	apiSuccess(
		await updateTutorial(
			await tutorialId(context),
			parseWithAppError(updateTutorialSchema, await request.json()),
		),
	),
);

export const DELETE = withAdmin(async (_request, _user, context) =>
	apiSuccess(await deleteTutorial(await tutorialId(context))),
);
