import { createSectionRevision, listSectionRevisions } from '@/features/learn';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { z } from 'zod';
import { parseSchema } from '@/lib/validation/parse';

const revisionRequestSchema = z.object({
	reason: z.enum(['manual', 'conflict']).optional(),
});

export const GET = withAdmin(async (_request, _user, context) => {
	const id = String((await context!.params).id);
	return apiSuccess(await listSectionRevisions(id));
});

export const POST = withAdmin(async (request, _user, context) => {
	const id = String((await context!.params).id);
	const body = parseSchema(revisionRequestSchema, await request.json().catch(() => ({})));
	return apiSuccess(await createSectionRevision(id, body.reason ?? 'manual'));
});
