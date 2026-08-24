import { createSubject, createSubjectSchema, listAdminSubjects, parseWithAppError } from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const GET = withAdmin(async () => apiSuccess(await listAdminSubjects()));

export const POST = withAdmin(async (request: NextRequest) =>
	apiSuccess(await createSubject(parseWithAppError(createSubjectSchema, await request.json())), 201),
);
