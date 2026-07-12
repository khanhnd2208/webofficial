import { type NextRequest } from 'next/server';
import { z } from 'zod';

import { enrollmentService } from '@/features/enrollments';
import { withAdmin, apiSuccess } from '@/lib/apiUtils';
import { parseSchema } from '@/shared/validation/parse';

const actionSchema = z.object({
	action: z.enum(['revoke', 'restore']),
});

export const PATCH = withAdmin(async (request: NextRequest, _user, context) => {
	const { id } = await context!.params;
	const body: unknown = await request.json();
	const input = parseSchema(actionSchema, body);
	const enrollment =
		input.action === 'revoke'
			? await enrollmentService.revokeEnrollment(String(id))
			: await enrollmentService.restoreEnrollment(String(id));
	return apiSuccess(enrollment);
});
