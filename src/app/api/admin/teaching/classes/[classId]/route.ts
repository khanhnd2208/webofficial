import {
	deleteTeachingClass,
	getTeachingClass,
	parseWithAppError,
	updateTeachingClass,
	updateTeachingClassSchema,
} from '@/features/teaching';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import type { NextRequest } from 'next/server';

async function classId(context?: { params: Promise<{ classId: string }> }) {
	return String((await context!.params).classId);
}

export const GET = withAdmin(async (_request, _user, context) => apiSuccess(await getTeachingClass(await classId(context))));

export const PATCH = withAdmin(async (request: NextRequest, _user, context) =>
	apiSuccess(
		await updateTeachingClass(await classId(context), parseWithAppError(updateTeachingClassSchema, await request.json())),
	),
);

export const DELETE = withAdmin(async (_request, _user, context) =>
	apiSuccess(await deleteTeachingClass(await classId(context))),
);
