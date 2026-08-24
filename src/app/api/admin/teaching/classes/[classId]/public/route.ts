import type { NextRequest } from 'next/server';

import {
	getTeachingPublicPageConfig,
	parseWithAppError,
	updateTeachingPublicPage,
	updateTeachingPublicPageSchema,
} from '@/features/teaching';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';

async function classId(context?: { params: Promise<{ classId: string }> }) {
	return String((await context!.params).classId);
}

export const GET = withAdmin(async (_request, _user, context) =>
	apiSuccess(await getTeachingPublicPageConfig(await classId(context))),
);

export const PATCH = withAdmin(async (request: NextRequest, _user, context) =>
	apiSuccess(
		await updateTeachingPublicPage(
			await classId(context),
			parseWithAppError(updateTeachingPublicPageSchema, await request.json()),
		),
	),
);
