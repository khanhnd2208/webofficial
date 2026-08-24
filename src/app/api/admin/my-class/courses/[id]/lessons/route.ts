import { createLesson, lessonInputSchema, parseWithAppError } from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const POST = withAdmin(async (request: NextRequest, _user, context) =>
	apiSuccess(
		await createLesson(String((await context!.params).id), parseWithAppError(lessonInputSchema, await request.json())),
		201,
	),
);
