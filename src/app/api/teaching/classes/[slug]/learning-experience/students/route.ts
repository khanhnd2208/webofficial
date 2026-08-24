import type { NextRequest } from 'next/server';

import { searchLearningExperienceStudents } from '@/features/teaching';
import { apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { assertScopedRateLimit } from '@/lib/inquiryRateLimit';

export const GET = withErrorHandling(async (request: NextRequest, context) => {
	const slug = String((await context!.params).slug);
	const query = request.nextUrl.searchParams.get('q') ?? '';
	await assertScopedRateLimit(
		request,
		`teaching-learning-experience-student-search:${slug}`,
		60,
		5 * 60 * 1000,
	);
	return apiSuccess(await searchLearningExperienceStudents(slug, query));
});
