import {
	parseWithAppError,
	updateEnrollment,
	updateEnrollmentSchema,
	withdrawEnrollment,
} from '@/features/teaching';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import type { NextRequest } from 'next/server';

async function enrollmentId(context?: { params: Promise<{ enrollmentId: string }> }) {
	return String((await context!.params).enrollmentId);
}

export const PATCH = withAdmin(async (request: NextRequest, _user, context) =>
	apiSuccess(
		await updateEnrollment(
			await enrollmentId(context),
			parseWithAppError(updateEnrollmentSchema, await request.json()),
		),
	),
);

export const DELETE = withAdmin(async (_request, _user, context) =>
	apiSuccess(await withdrawEnrollment(await enrollmentId(context))),
);
