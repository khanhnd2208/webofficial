import { type NextRequest } from 'next/server';

import { createSubjectSchema, myspaceTestsService } from '@/features/myspace-tests';
import { withAdmin, apiSuccess } from '@/lib/apiUtils';
import { parseSchema } from '@/lib/validation/parse';

export const GET = withAdmin(async () => {
	const items = await myspaceTestsService.listSubjects();
	return apiSuccess({ items });
});

export const POST = withAdmin(async (request: NextRequest) => {
	const body: unknown = await request.json();
	const input = parseSchema(createSubjectSchema, body);
	const subject = await myspaceTestsService.createSubject(input);
	return apiSuccess(subject, 201);
});
