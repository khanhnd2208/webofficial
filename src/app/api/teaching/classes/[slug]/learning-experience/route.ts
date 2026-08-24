import type { NextRequest } from 'next/server';

import {
	getLearningExperienceSession,
	getLearningExperienceViewerEnrollmentId,
	learningExperienceChoiceSchema,
	learningExperienceLoginSchema,
	loginToLearningExperience,
	logoutFromLearningExperience,
	parseWithAppError,
	saveLearningExperienceChoice,
} from '@/features/teaching';
import { apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { assertScopedRateLimit } from '@/lib/inquiryRateLimit';

export const GET = withErrorHandling(async (_request: NextRequest, context) => {
	const slug = String((await context!.params).slug);
	return apiSuccess(await getLearningExperienceSession(slug));
});

export const POST = withErrorHandling(async (request: NextRequest, context) => {
	const slug = String((await context!.params).slug);
	const input = parseWithAppError(learningExperienceLoginSchema, await request.json());
	await assertScopedRateLimit(
		request,
		`teaching-learning-experience-login:${slug}:${input.enrollmentId}`,
		10,
		5 * 60 * 1000,
	);
	return apiSuccess(await loginToLearningExperience(slug, input));
});

export const PUT = withErrorHandling(async (request: NextRequest, context) => {
	const slug = String((await context!.params).slug);
	const input = parseWithAppError(learningExperienceChoiceSchema, await request.json());
	const enrollmentId = await getLearningExperienceViewerEnrollmentId(slug);
	await assertScopedRateLimit(
		request,
		`teaching-learning-experience-choice:${slug}:${enrollmentId}`,
		10,
		5 * 60 * 1000,
	);
	return apiSuccess(await saveLearningExperienceChoice(slug, input));
});

export const DELETE = withErrorHandling(async (_request: NextRequest, context) => {
	const slug = String((await context!.params).slug);
	await logoutFromLearningExperience(slug);
	return apiSuccess({ loggedOut: true });
});
