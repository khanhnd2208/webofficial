import { type NextRequest } from 'next/server';

import { courseService, createModuleSchema, reorderSchema } from '@/features/courses';
import { withAdmin, apiSuccess } from '@/lib/apiUtils';
import { parseSchema } from '@/shared/validation/parse';

export const POST = withAdmin(async (request: NextRequest, _user, context) => {
	const { id: courseId } = await context!.params;
	const body: unknown = await request.json();
	const input = parseSchema(createModuleSchema, body);
	const mod = await courseService.createAdminModule(String(courseId), input);
	return apiSuccess(mod, 201);
});

export const PUT = withAdmin(async (request: NextRequest, _user, context) => {
	const { id: courseId } = await context!.params;
	const body: unknown = await request.json();
	const input = parseSchema(reorderSchema, body);
	const course = await courseService.reorderAdminModules(String(courseId), input.orderedIds);
	return apiSuccess(course);
});
