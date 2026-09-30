import { type NextRequest } from 'next/server';
import { z } from 'zod';

import { enrollmentService } from '@/features/enrollments';
import { withAdmin, apiSuccess } from '@/lib/apiUtils';
import { parseSchema } from '@/lib/validation/parse';

const querySchema = z.object({
	q: z.string().trim().min(2, 'Nhập ít nhất 2 ký tự'),
});

export const GET = withAdmin(async (request: NextRequest) => {
	const url = new URL(request.url);
	const query = parseSchema(querySchema, { q: url.searchParams.get('q') ?? '' });
	const users = await enrollmentService.searchUsersForEnrollment(query.q);
	return apiSuccess({ users });
});
