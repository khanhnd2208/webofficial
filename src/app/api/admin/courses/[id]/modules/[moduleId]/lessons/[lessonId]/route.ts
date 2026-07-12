import { type NextRequest } from 'next/server';

import { courseService, updateLessonSchema } from '@/features/courses';
import { withAdmin, apiSuccess } from '@/lib/apiUtils';
import { parseSchema } from '@/shared/validation/parse';

export const GET = withAdmin(async (_request: NextRequest, _user, context) => {
	const { id: courseId, lessonId } = await context!.params;
	const result = await courseService.getAdminLessonForEditor(String(lessonId), String(courseId));
	return apiSuccess(result);
});

export const PATCH = withAdmin(async (request: NextRequest, _user, context) => {
	const { lessonId } = await context!.params;
	const body: unknown = await request.json();
	const input = parseSchema(updateLessonSchema, body);
	const lesson = await courseService.updateAdminLesson(String(lessonId), input);
	return apiSuccess(lesson);
});

export const DELETE = withAdmin(async (_request: NextRequest, _user, context) => {
	const { lessonId } = await context!.params;
	await courseService.deleteAdminLesson(String(lessonId));
	return apiSuccess(null);
});
