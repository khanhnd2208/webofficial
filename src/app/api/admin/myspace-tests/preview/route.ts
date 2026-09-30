import { type NextRequest } from 'next/server';
import { z } from 'zod';

import { myspaceTestsService } from '@/features/myspace-tests';
import { withAdmin, apiSuccess } from '@/lib/apiUtils';
import { parseSchema } from '@/lib/validation/parse';

const previewSchema = z.object({
	subjectId: z.string().trim().min(1),
	topics: z.array(z.string()).optional(),
	difficulties: z.array(z.number().int()).optional(),
	classifications: z.array(z.string()).optional(),
	questionCount: z.number().int().min(1).max(200),
});

export const POST = withAdmin(async (request: NextRequest) => {
	const body: unknown = await request.json();
	const input = parseSchema(previewSchema, body);
	const result = await myspaceTestsService.previewSample(input);
	return apiSuccess(result);
});
