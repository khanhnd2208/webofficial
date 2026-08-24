import { courseWorkspacePath } from './workspaceUrl';
import type { ReadingLevel } from './readingLevel';

export type LearnerItem = {
	key: string;
	kind: 'knowledge';
	title: string;
	slug: string;
	href: string;
	lessonSlug: string;
	lessonTitle: string;
	sectionTitle: string;
};

export type LearnerState = {
	totalItems: number;
	completedItems: number;
	percent: number;
	currentItem: LearnerItem | null;
	nextItem: LearnerItem | null;
	items: LearnerItem[];
};

export type OutlineItemStatus = 'done' | 'current' | 'not_started';

export type MyClassOutlineSeed = {
	courseId: string;
	courseSlug: string;
	lessonId: string;
	lessonSlug: string;
	lessonTitle: string;
	sectionId: string;
	sectionSlug: string;
	sectionTitle: string;
	knowledgeUnitId: string;
	knowledgeUnitSlug: string;
	title: string;
	summary?: string;
	availableLevels: ReadingLevel[];
	estimatedMinutes?: number | null;
};

export type MyClassOutlineItem = MyClassOutlineSeed & {
	position: number;
	status: OutlineItemStatus;
};

export type OutlineItemLink = {
	href: string;
	courseSlug: string;
	lessonSlug: string;
	sectionId: string;
	sectionSlug: string;
	kuSlug: string;
	knowledgeUnitId: string;
	title: string;
};

export type MyClassLearnerState = {
	totalItems: number;
	completedItems: number;
	percent: number;
	currentItem: MyClassOutlineItem | null;
	nextItem: MyClassOutlineItem | null;
	/** Canonical names for the item opened by Resume and the item after it. */
	resumeItem: MyClassOutlineItem | null;
	afterResumeItem: MyClassOutlineItem | null;
	isComplete: boolean;
	completedUnitIds: string[];
};

export type ResolveLearnerStateInput = {
	seeds: MyClassOutlineSeed[];
	completedUnitIds: Iterable<string>;
	openedUnitId?: string | null;
};

function withHref(item: MyClassOutlineSeed, seeds: MyClassOutlineSeed[] = []): OutlineItemLink {
	const sameLessonOccurrences = seeds.filter(
		(seed) =>
			seed.lessonSlug === item.lessonSlug && seed.knowledgeUnitSlug === item.knowledgeUnitSlug,
	);
	const needsSection = sameLessonOccurrences.length > 1;
	return {
		href: courseWorkspacePath(item.courseSlug, {
			lesson: item.lessonSlug,
			s: needsSection ? item.sectionSlug : null,
			unit: item.knowledgeUnitSlug,
		}),
		courseSlug: item.courseSlug,
		lessonSlug: item.lessonSlug,
		sectionId: item.sectionId,
		sectionSlug: item.sectionSlug,
		kuSlug: item.knowledgeUnitSlug,
		knowledgeUnitId: item.knowledgeUnitId,
		title: item.title,
	};
}

export function toOutlineItemLink(
	item: MyClassOutlineSeed,
	seeds: MyClassOutlineSeed[] = [],
): OutlineItemLink {
	return withHref(item, seeds);
}

/** First occurrence of each published KU in curriculum order. Tests/vocab are not seeds. */
export function uniqueCurriculumSeeds(seeds: MyClassOutlineSeed[]): MyClassOutlineSeed[] {
	const seen = new Set<string>();
	const unique: MyClassOutlineSeed[] = [];
	for (const seed of seeds) {
		if (seen.has(seed.knowledgeUnitId)) continue;
		seen.add(seed.knowledgeUnitId);
		unique.push(seed);
	}
	return unique;
}

function decorate(
	seed: MyClassOutlineSeed,
	position: number,
	status: OutlineItemStatus,
): MyClassOutlineItem {
	return { ...seed, position, status };
}

export function resolveLearnerState(input: ResolveLearnerStateInput): MyClassLearnerState {
	const unique = uniqueCurriculumSeeds(input.seeds);
	const completed = new Set(
		[...input.completedUnitIds].filter((id) => unique.some((seed) => seed.knowledgeUnitId === id)),
	);
	const totalItems = unique.length;
	const completedItems = unique.filter((seed) => completed.has(seed.knowledgeUnitId)).length;
	const percent = totalItems === 0 ? 0 : Math.ceil((completedItems / totalItems) * 100);
	const isComplete = totalItems > 0 && completedItems === totalItems;

	const uncompleted = unique.filter((seed) => !completed.has(seed.knowledgeUnitId));
	const opened = input.openedUnitId
		? uncompleted.find((seed) => seed.knowledgeUnitId === input.openedUnitId)
		: undefined;
	const currentSeed = opened ?? uncompleted[0] ?? null;
	const currentIndex = currentSeed
		? unique.findIndex((seed) => seed.knowledgeUnitId === currentSeed.knowledgeUnitId)
		: -1;
	const nextSeed =
		currentIndex >= 0
			? (unique.slice(currentIndex + 1).find((seed) => !completed.has(seed.knowledgeUnitId)) ??
				null)
			: null;

	const currentItem = currentSeed
		? decorate(
				currentSeed,
				unique.findIndex((seed) => seed.knowledgeUnitId === currentSeed.knowledgeUnitId),
				isComplete ? 'done' : 'current',
			)
		: null;
	const nextItem = nextSeed
		? decorate(
				nextSeed,
				unique.findIndex((seed) => seed.knowledgeUnitId === nextSeed.knowledgeUnitId),
				'not_started',
			)
		: null;

	return {
		totalItems,
		completedItems,
		percent,
		currentItem,
		nextItem: isComplete ? null : nextItem,
		resumeItem: currentItem,
		afterResumeItem: isComplete ? null : nextItem,
		isComplete,
		completedUnitIds: unique
			.filter((seed) => completed.has(seed.knowledgeUnitId))
			.map((seed) => seed.knowledgeUnitId),
	};
}

/**
 * Return the first unfinished item after a completed item in curriculum order.
 * The scan wraps once so finishing an item can never skip an unfinished item
 * that appears earlier in the outline.
 */
export function nextUnfinishedAfter(
	completedUnitId: string,
	seeds: MyClassOutlineSeed[],
	completedUnitIds: Iterable<string>,
): MyClassOutlineItem | null {
	const unique = uniqueCurriculumSeeds(seeds);
	const completed = new Set(completedUnitIds);
	const start = unique.findIndex((seed) => seed.knowledgeUnitId === completedUnitId);
	const ordered = start < 0 ? unique : [...unique.slice(start + 1), ...unique.slice(0, start)];
	const next = ordered.find((seed) => !completed.has(seed.knowledgeUnitId));
	if (!next) return null;
	return decorate(
		next,
		unique.findIndex((seed) => seed.knowledgeUnitId === next.knowledgeUnitId),
		'not_started',
	);
}

export function outlineItemsForDisplay(
	seeds: MyClassOutlineSeed[],
	state: MyClassLearnerState,
): MyClassOutlineItem[] {
	const uniqueIndex = new Map(
		uniqueCurriculumSeeds(seeds).map((seed, index) => [seed.knowledgeUnitId, index]),
	);
	const completed = new Set(state.completedUnitIds);
	const currentId = state.currentItem?.knowledgeUnitId;
	return seeds.map((seed) => {
		const position = uniqueIndex.get(seed.knowledgeUnitId) ?? 0;
		let status: OutlineItemStatus = 'not_started';
		if (completed.has(seed.knowledgeUnitId)) status = 'done';
		else if (seed.knowledgeUnitId === currentId) status = 'current';
		return decorate(seed, position, status);
	});
}

export function seedsFromCourseOutline(course: {
	id: string;
	slug: string;
	lessons: Array<{
		id: string;
		slug: string;
		title: string;
		sections: Array<{
			id: string;
			slug?: string;
			title: string;
			knowledgeUnits: Array<{
				id: string;
				slug: string;
				title: string;
				summary?: string;
				availableLevels: ReadingLevel[];
				estimatedMinutes?: number | null;
			}>;
		}>;
	}>;
}): MyClassOutlineSeed[] {
	const seeds: MyClassOutlineSeed[] = [];
	for (const lesson of course.lessons) {
		for (const section of lesson.sections) {
			for (const unit of section.knowledgeUnits) {
				seeds.push({
					courseId: course.id,
					courseSlug: course.slug,
					lessonId: lesson.id,
					lessonSlug: lesson.slug,
					lessonTitle: lesson.title,
					sectionId: section.id,
					sectionSlug:
						section.slug ||
						`phan-${'position' in section ? Number((section as { position?: number }).position ?? 0) + 1 : 1}`,
					sectionTitle: section.title,
					knowledgeUnitId: unit.id,
					knowledgeUnitSlug: unit.slug,
					title: unit.title,
					summary: unit.summary,
					availableLevels: unit.availableLevels,
					estimatedMinutes: unit.estimatedMinutes,
				});
			}
		}
	}
	return seeds;
}

/** @deprecated Use resolveLearnerState. Kept so mismatch tests can document the v1 bug. */
export function flattenLearnerItems(course: {
	slug: string;
	lessons: Array<{
		slug: string;
		title: string;
		sections: Array<{
			id: string;
			title: string;
			knowledgeUnits: Array<{ slug: string; title: string }>;
		}>;
	}>;
}) {
	return course.lessons.flatMap((lesson) =>
		lesson.sections.flatMap((section) =>
			section.knowledgeUnits.map((unit) => ({
				key: `${course.slug}:${unit.slug}`,
				kind: 'knowledge' as const,
				title: unit.title,
				slug: unit.slug,
				href: `/my-space/my-class/${course.slug}/knowledge/${unit.slug}?lesson=${encodeURIComponent(lesson.slug)}&section=${encodeURIComponent(section.id)}`,
				lessonSlug: lesson.slug,
				lessonTitle: lesson.title,
				sectionTitle: section.title,
			})),
		),
	);
}

/** @deprecated v1 resolver that keyed completion by `${course.slug}:${unit.slug}`. */
export function learnerState(
	course: Parameters<typeof flattenLearnerItems>[0],
	completedKeys: Set<string>,
) {
	const items = flattenLearnerItems(course);
	const completedItems = items.filter((item) => completedKeys.has(item.key)).length;
	const currentItem = items.find((item) => !completedKeys.has(item.key)) ?? items.at(-1) ?? null;
	const currentIndex = currentItem ? items.findIndex((item) => item.key === currentItem.key) : -1;
	return {
		totalItems: items.length,
		completedItems,
		percent: items.length ? Math.round((completedItems / items.length) * 100) : 0,
		currentItem,
		nextItem: currentIndex >= 0 ? (items[currentIndex + 1] ?? null) : null,
		items,
	};
}

export function nextKnowledgeHref(data: {
	course: { slug: string };
	next: { slug: string; lessonSlug: string; sectionId: string; sectionSlug?: string } | null;
}): string | null {
	if (!data.next) return null;
	return courseWorkspacePath(data.course.slug, {
		lesson: data.next.lessonSlug,
		s: data.next.sectionSlug ?? null,
		unit: data.next.slug,
	});
}
