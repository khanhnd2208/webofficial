import { getAuthoringKnowledgeUnit } from '@/features/my-class';
import { apiSuccess, withAdmin } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

export const GET = withAdmin(async (request: NextRequest, user, context) => {
	const { courseSlug, kuSlug } = await context!.params;
	const lessonSlug = request.nextUrl.searchParams.get('lesson') ?? undefined;
	const sectionId = request.nextUrl.searchParams.get('section') ?? undefined;
	const detail = await getAuthoringKnowledgeUnit(String(courseSlug), String(kuSlug), user.role, {
		lessonSlug,
		sectionId,
	});
	return apiSuccess({
		unit: detail.unit,
		context: {
			course: detail.course,
			lesson: {
				id: detail.context.lessonId,
				slug: detail.context.lessonSlug,
				title: detail.context.lessonTitle,
			},
			section: { id: detail.context.sectionId, title: detail.context.sectionTitle },
		},
		previous: detail.previous,
		next: detail.next,
		progress: null,
	});
});
