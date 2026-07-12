import { type NextRequest } from 'next/server';
import { z } from 'zod';

import { enrollSchema } from '@/features/courses/schemas';
import { enrollmentService } from '@/features/enrollments';
import { withAdmin, apiSuccess } from '@/lib/apiUtils';
import { parseSchema } from '@/shared/validation/parse';

const listQuerySchema = z.object({
	courseId: z.string().min(1),
});

export const GET = withAdmin(async (request: NextRequest) => {
	const url = new URL(request.url);
	const query = parseSchema(listQuerySchema, {
		courseId: url.searchParams.get('courseId') ?? '',
	});
	const items = await enrollmentService.listCourseEnrollmentsAdmin(query.courseId);
	return apiSuccess({ items });
});

export const POST = withAdmin(async (request: NextRequest) => {
	const body: unknown = await request.json();
	const input = parseSchema(enrollSchema, body);
	const enrollment = await enrollmentService.enrollUser(input.courseId, input.userId);
	return apiSuccess(enrollment, 201);
});
