import { type NextRequest } from 'next/server';

import { courseService, updateModuleSchema } from '@/features/courses';
import { withAdmin, apiSuccess } from '@/lib/apiUtils';
import { parseSchema } from '@/lib/validation/parse';

export const PATCH = withAdmin(async (request: NextRequest, _user, context) => {
	const { moduleId } = await context!.params;
	const body: unknown = await request.json();
	const input = parseSchema(updateModuleSchema, body);
	const mod = await courseService.updateAdminModule(String(moduleId), input);
	return apiSuccess(mod);
});

export const DELETE = withAdmin(async (_request: NextRequest, _user, context) => {
	const { moduleId } = await context!.params;
	await courseService.deleteAdminModule(String(moduleId));
	return apiSuccess(null);
});
