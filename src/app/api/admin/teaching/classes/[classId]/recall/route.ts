import {
	listClassRecallAssignments,
	parseWithAppError,
	updateClassRecallAssignments,
	updateTeachingClassRecallSchema,
} from '@/features/teaching';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import type { NextRequest } from 'next/server';

async function classId(context?: { params: Promise<{ classId: string }> }) {
	return String((await context!.params).classId);
}

export const GET = withAdmin(async (_request, _user, context) =>
	apiSuccess(await listClassRecallAssignments(await classId(context))),
);

export const PUT = withAdmin(async (request: NextRequest, _user, context) =>
	apiSuccess(
		await updateClassRecallAssignments(
			await classId(context),
			parseWithAppError(updateTeachingClassRecallSchema, await request.json()),
		),
	),
);
