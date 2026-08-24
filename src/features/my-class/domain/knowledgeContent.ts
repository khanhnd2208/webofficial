import { hasHtmlContent } from './normalize';
import { sanitizeMyClassHtml } from './sanitize';
import type { ExplanationMode, LearningModule, LearningSubjectSummary, MyClassCourseDetail, MyClassKnowledgeUnit, LearningUnitSummary } from '../types';
import type { MyClassLearnerState } from './learnerState';

export type KnowledgeExplanation = {
	shortHtml: string;
	deepHtml: string;
	availableModes: ExplanationMode[];
};

/**
 * The learner surface has two explanations, while legacy revisions still
 * store Foundation, Academic and Expert HTML. Keep the legacy fields intact
 * and expose a stable two-mode contract to the new UI.
 */
export function knowledgeExplanation(unit: Pick<MyClassKnowledgeUnit, 'foundationHtml' | 'academicHtml' | 'expertHtml'>): KnowledgeExplanation {
	const foundation = sanitizeMyClassHtml(unit.foundationHtml);
	const academic = sanitizeMyClassHtml(unit.academicHtml);
	const expert = sanitizeMyClassHtml(unit.expertHtml);
	const shortHtml = hasHtmlContent(foundation)
		? foundation
		: hasHtmlContent(academic)
			? academic
			: expert;
	const deepParts = [academic, expert].filter(hasHtmlContent);
	const deepHtml = deepParts.length
		? deepParts.join('<hr class="knowledge-depth-divider" />')
		: foundation;
	const availableModes: ExplanationMode[] = [];
	if (hasHtmlContent(shortHtml)) availableModes.push('short');
	if (hasHtmlContent(deepHtml)) availableModes.push('deep');
	return { shortHtml, deepHtml, availableModes };
}

export function htmlForExplanation(
	unit: Pick<MyClassKnowledgeUnit, 'foundationHtml' | 'academicHtml' | 'expertHtml'>,
	mode: ExplanationMode,
): string {
	const explanation = knowledgeExplanation(unit);
	return mode === 'short' ? explanation.shortHtml : explanation.deepHtml;
}

/** Build the learner-facing two-level curriculum DTO without changing Prisma's hierarchy. */
export function buildLearningSubjectSummary(course: MyClassCourseDetail, state: MyClassLearnerState): LearningSubjectSummary {
	const completed = new Set(state.completedUnitIds);
	const modes = (levels: string[]): ExplanationMode[] => {
		const result: ExplanationMode[] = [];
		if (levels.includes('readable')) result.push('short');
		if (levels.includes('academic') || levels.includes('deep')) result.push('deep');
		return result.length ? result : ['short', 'deep'];
	};
	const lessons: LearningUnitSummary[] = course.lessons.slice().sort((a, b) => a.position - b.position).map((lesson) => {
		const lessonModules: LearningModule[] = lesson.sections.slice().sort((a, b) => a.position - b.position).map((section) => {
			const items = section.knowledgeUnits.map((unit, position) => ({
				id: unit.id,
				slug: unit.slug,
				title: unit.title,
				summary: unit.summary,
				position,
				completed: completed.has(unit.id),
				availableModes: modes(unit.availableLevels),
			}));
			const completedItems = items.filter((item) => item.completed).length;
			return {
				id: section.id,
				slug: section.slug,
				title: section.title,
				summary: section.summary,
				position: section.position,
				sourceChapter: { id: lesson.id, slug: lesson.slug, title: lesson.title, position: lesson.position },
				progressPercent: items.length ? Math.ceil((completedItems / items.length) * 100) : 0,
				completedItems,
				totalItems: items.length,
				items,
				tests: section.tests,
			};
		});
		const lessonItems = lessonModules.flatMap((module) => module.items);
		const lessonCompleted = lessonItems.filter((item) => item.completed).length;
		return {
			id: lesson.id,
			slug: lesson.slug,
			title: lesson.title,
			summary: lesson.summary,
			position: lesson.position,
			progressPercent: lessonItems.length ? Math.ceil((lessonCompleted / lessonItems.length) * 100) : 0,
			completedItems: lessonCompleted,
			totalItems: lessonItems.length,
			modules: lessonModules,
		};
	});
	const modules = lessons.flatMap((lesson) => lesson.modules);
	return {
		id: course.id,
		slug: course.slug,
		title: course.title,
		summary: course.summary,
		progressPercent: state.percent,
		completedItems: state.completedItems,
		totalItems: state.totalItems,
		modules,
		lessons,
		units: lessons,
	};
}
