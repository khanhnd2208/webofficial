import {
	createActiveRecallDeckSchema,
	createAdminRecallDeck,
	listAdminRecallDecksForCourse,
} from '@/features/active-recall';
import { assertCourseIsActive, getTeachingCourse, parseWithAppError } from '@/features/teaching';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import type { NextRequest } from 'next/server';

async function courseId(context?: { params: Promise<{ courseId: string }> }) {
	return String((await context!.params).courseId);
}

export const GET = withAdmin(async (_request, _user, context) => {
	const id = await courseId(context);
	await getTeachingCourse(id);
	return apiSuccess(await listAdminRecallDecksForCourse(id));
});

export const POST = withAdmin(async (request: NextRequest, _user, context) => {
	const id = await courseId(context);
	await assertCourseIsActive(id);
	const body = parseWithAppError(createActiveRecallDeckSchema, await request.json());
	return apiSuccess(await createAdminRecallDeck({ ...body, courseId: id }), 201);
});
