import { getKnowledgeUnit, knowledgeExplanation, loadCourseLearnerState } from '@/features/my-class';
import { resolveMyClassActorOptional } from '@/features/my-class/services/resolveActor';
import type { ReadingLevel } from '@/features/my-class/domain/readingLevel';
import { courseUnitPath } from '@/features/my-class/domain/workspaceUrl';
import type { MyClassKnowledgeUnit } from '@/features/my-class/types';
import { apiSuccess, withErrorHandling } from '@/lib/apiUtils';
import { type NextRequest } from 'next/server';

function parseLevel(value: string | null): ReadingLevel | null {
	if (value === 'readable' || value === 'academic' || value === 'deep') return value;
	return null;
}

function trimUnitToLevel(unit: MyClassKnowledgeUnit, level: ReadingLevel | null): MyClassKnowledgeUnit {
	if (!level) return unit;
	return {
		...unit,
		foundationHtml: level === 'readable' ? unit.foundationHtml : '',
		academicHtml: level === 'academic' ? unit.academicHtml : '',
		expertHtml: level === 'deep' ? unit.expertHtml : '',
	};
}

export const GET = withErrorHandling(async (request: NextRequest, context) => {
	const { courseSlug, kuSlug } = await context!.params;
	const lessonSlug = request.nextUrl.searchParams.get('lesson') ?? undefined;
	const sectionId = request.nextUrl.searchParams.get('section') ?? undefined;
	const level = parseLevel(request.nextUrl.searchParams.get('level'));
	const unit = await getKnowledgeUnit(String(courseSlug), String(kuSlug), { lessonSlug, sectionId });
	const explanation = knowledgeExplanation(unit.unit);
	const actor = await resolveMyClassActorOptional(request);
	const { learnerState } = await loadCourseLearnerState(String(courseSlug), actor, unit.unit.id);
	const neighbor = (
		item: NonNullable<typeof unit.previous>,
	) => ({
		href: courseUnitPath(unit.course.slug, item.lessonSlug, item.slug, {
			sectionSlug: item.sectionSlug ?? null,
		}),
		courseSlug: unit.course.slug,
		lessonSlug: item.lessonSlug,
		sectionId: item.sectionId,
		sectionSlug: item.sectionSlug,
		kuSlug: item.slug,
		knowledgeUnitId: item.knowledgeUnitId,
		title: item.title,
	});
	return apiSuccess({
		unit: { ...trimUnitToLevel(unit.unit, level), shortHtml: explanation.shortHtml, deepHtml: explanation.deepHtml, availableModes: explanation.availableModes },
		context: {
			course: unit.course,
			lesson: { id: unit.context.lessonId, slug: unit.context.lessonSlug, title: unit.context.lessonTitle },
			section: { id: unit.context.sectionId, slug: unit.context.sectionSlug, title: unit.context.sectionTitle },
		},
		previous: unit.previous ? neighbor(unit.previous) : null,
		next: unit.next ? neighbor(unit.next) : null,
		related: unit.related,
		progress: learnerState,
	});
});
