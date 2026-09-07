import {
	deleteTeachingCourse,
	getTeachingCourseWorkspace,
	parseWithAppError,
	updateTeachingCourse,
	updateTeachingCourseSchema,
} from '@/features/teaching';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import type { NextRequest } from 'next/server';

async function courseId(context?: { params: Promise<{ courseId: string }> }) {
	return String((await context!.params).courseId);
}

export const GET = withAdmin(async (_request, _user, context) =>
	apiSuccess(await getTeachingCourseWorkspace(await courseId(context))),
);

export const PATCH = withAdmin(async (request: NextRequest, _user, context) =>
	apiSuccess(
		await updateTeachingCourse(
			await courseId(context),
			parseWithAppError(updateTeachingCourseSchema, await request.json()),
		),
	),
);

export const DELETE = withAdmin(async (_request, _user, context) =>
	apiSuccess(await deleteTeachingCourse(await courseId(context))),
);
