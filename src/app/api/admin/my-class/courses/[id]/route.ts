import {
	archiveAdminCourse,
	getAdminCourse,
	parseWithAppError,
	updateAdminCourse,
	updateCourseSchema,
} from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const GET = withAdmin(async (_request, _user, context) =>
	apiSuccess(await getAdminCourse(String((await context!.params).id))),
);

export const PATCH = withAdmin(async (request: NextRequest, _user, context) =>
	apiSuccess(
		await updateAdminCourse(
			String((await context!.params).id),
			parseWithAppError(updateCourseSchema, await request.json()),
		),
	),
);

export const DELETE = withAdmin(async (_request, _user, context) =>
	apiSuccess(await archiveAdminCourse(String((await context!.params).id))),
);
