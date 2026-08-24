import { setupTeachingClass, teachingClassSetupSchema, parseWithAppError } from '@/features/teaching';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import type { NextRequest } from 'next/server';

export const POST = withAdmin(async (request: NextRequest) =>
	apiSuccess(await setupTeachingClass(parseWithAppError(teachingClassSetupSchema, await request.json())), 201),
);
