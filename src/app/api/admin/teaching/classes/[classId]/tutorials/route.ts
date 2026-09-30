import {
	createTutorial,
	createTutorialSchema,
	listTutorials,
	parseWithAppError,
} from '@/features/teaching';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import type { NextRequest } from 'next/server';

async function classId(context?: { params: Promise<{ classId: string }> }) {
	return String((await context!.params).classId);
}

export const GET = withAdmin(async (_request, _user, context) =>
	apiSuccess(await listTutorials(await classId(context))),
);

export const POST = withAdmin(async (request: NextRequest, _user, context) =>
	apiSuccess(
		await createTutorial(
			await classId(context),
			parseWithAppError(createTutorialSchema, await request.json()),
		),
		201,
	),
);
