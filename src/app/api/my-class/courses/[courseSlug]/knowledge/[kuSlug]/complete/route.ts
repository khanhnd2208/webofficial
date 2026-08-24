import { completeKnowledgeSchema, completeKnowledgeUnit, parseWithAppError } from '@/features/my-class';
import { resolveMyClassActor } from '@/features/my-class/services/resolveActor';
import { apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const POST = withErrorHandling(async (request: NextRequest, context) => {
	const { courseSlug, kuSlug } = await context!.params;
	const actor = await resolveMyClassActor(request, { ensureGuest: true });
	const body = parseWithAppError(completeKnowledgeSchema, await request.json().catch(() => ({})));
	return apiSuccess(
		await completeKnowledgeUnit({
			actor,
			courseSlug: String(courseSlug),
			kuSlug: String(kuSlug),
			lessonSlug: body.lessonSlug,
			sectionId: body.sectionId,
		}),
	);
});
