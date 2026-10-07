import { newQuestionId } from '@/features/learn/content';
import type { LearnStudioLesson, LearnStudioSection } from '@/features/learn/types';

export interface OutlineOrder {
	id: string;
	sectionIds: string[];
}

/** Body of `PUT /courses/:id/outline`. */
export function outlineOrder(lessons: LearnStudioLesson[]): OutlineOrder[] {
	return lessons.map((lesson) => ({
		id: lesson.id,
		sectionIds: lesson.sections.map((section) => section.id),
	}));
}

/**
 * Put lessons and sections back in a saved order while keeping their current content.
 * Used when an outline save fails: edits typed during the request must survive the rollback.
 * Anything created after the snapshot stays, at the end of its lesson.
 */
export function applyOrder(
	current: LearnStudioLesson[],
	order: OutlineOrder[],
): LearnStudioLesson[] {
	const lessonsById = new Map(current.map((lesson) => [lesson.id, lesson]));
	const sectionsById = new Map(
		current.flatMap((lesson) => lesson.sections.map((section) => [section.id, section] as const)),
	);
	const placed = new Set<string>();
	const result = order.flatMap((entry) => {
		const lesson = lessonsById.get(entry.id);
		if (!lesson) return [];
		const sections = entry.sectionIds.flatMap((id) => {
			const section = sectionsById.get(id);
			if (!section) return [];
			placed.add(id);
			return [{ ...section, lessonId: lesson.id }];
		});
		return [{ ...lesson, sections }];
	});
	for (const lesson of current) {
		if (!result.some((item) => item.id === lesson.id)) result.push({ ...lesson, sections: [] });
	}
	for (const lesson of current) {
		for (const section of lesson.sections) {
			if (placed.has(section.id)) continue;
			const home = result.find((item) => item.id === section.lessonId) ?? result.at(-1);
			home?.sections.push(section);
		}
	}
	return result;
}

export function copyTitle(title: string): string {
	return `${title.trim() || 'Chưa đặt tên'} (bản sao)`.slice(0, 200);
}

/** PATCH body that turns a fresh section into a copy of `section`, with new question ids. */
export function sectionCopyBody(section: LearnStudioSection, title = section.title) {
	return {
		title: title.trim() || 'Mục mới',
		type: section.type,
		durationMinutes: section.durationMinutes,
		summary: section.summary,
		keyTakeaways: section.keyTakeaways.map((item) => item.trim()).filter(Boolean),
		markdown: section.markdown,
		discussion: section.discussion
			? {
					questions: section.discussion.questions.map((question) => ({
						...question,
						id: newQuestionId(),
					})),
				}
			: null,
	};
}

export function insertAfter<T extends { id: string }>(items: T[], afterId: string, item: T): T[] {
	const at = items.findIndex((entry) => entry.id === afterId);
	if (at < 0) return [...items, item];
	return [...items.slice(0, at + 1), item, ...items.slice(at + 1)];
}
