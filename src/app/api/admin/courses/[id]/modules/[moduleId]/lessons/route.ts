import { type NextRequest } from 'next/server';

import { courseService, createLessonSchema, reorderSchema } from '@/features/courses';
import { withAdmin, apiSuccess } from '@/lib/apiUtils';
import { parseSchema } from '@/lib/validation/parse';

export const POST = withAdmin(async (request: NextRequest, _user, context) => {
	const { moduleId } = await context!.params;
	const body: unknown = await request.json();
	const input = parseSchema(createLessonSchema, body);
	const lesson = await courseService.createAdminLesson(String(moduleId), input);
	return apiSuccess(lesson, 201);
});

export const PUT = withAdmin(async (request: NextRequest, _user, context) => {
	const { moduleId } = await context!.params;
	const body: unknown = await request.json();
	const input = parseSchema(reorderSchema, body);
	const mod = await courseService.reorderAdminLessons(String(moduleId), input.orderedIds);
	return apiSuccess(mod);
});
