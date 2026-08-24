import type { MyClassCourseDetail } from '@/features/my-class/types';

type ParentType = 'course' | 'lesson' | 'section';

function applyOrder<T extends { id: string; position: number }>(
	items: T[],
	orderedIds: string[],
): T[] | null {
	if (orderedIds.length !== items.length) return null;
	const map = new Map(items.map((item) => [item.id, item]));
	const next: T[] = [];
	for (const id of orderedIds) {
		const item = map.get(id);
		if (!item) return null;
		next.push(item);
	}
	if (next.length !== items.length) return null;
	return next.map((item, position) => (item.position === position ? item : { ...item, position }));
}

export function moveOrderedIds(ids: string[], activeId: string, overId: string): string[] | null {
	const oldIndex = ids.indexOf(activeId);
	const newIndex = ids.indexOf(overId);
	if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return null;
	const next = ids.slice();
	const [removed] = next.splice(oldIndex, 1);
	if (!removed) return null;
	next.splice(newIndex, 0, removed);
	return next;
}

/** Returns a new course tree with siblings reordered, or the original course if the payload is invalid. */
export function reorderCourseTree(
	course: MyClassCourseDetail,
	parentType: ParentType,
	parentId: string,
	orderedIds: string[],
): MyClassCourseDetail {
	if (parentType === 'course') {
		if (parentId !== course.id) return course;
		const lessons = applyOrder(course.lessons, orderedIds);
		return lessons ? { ...course, lessons } : course;
	}

	if (parentType === 'lesson') {
		let changed = false;
		const lessons = course.lessons.map((lesson) => {
			if (lesson.id !== parentId) return lesson;
			const sections = applyOrder(lesson.sections, orderedIds);
			if (!sections) return lesson;
			changed = true;
			return { ...lesson, sections };
		});
		return changed ? { ...course, lessons } : course;
	}

	let changed = false;
	const lessons = course.lessons.map((lesson) => {
		let sectionChanged = false;
		const sections = lesson.sections.map((section) => {
			if (section.id !== parentId) return section;
			const knowledgeUnits = applyOrder(section.knowledgeUnits, orderedIds);
			if (!knowledgeUnits) return section;
			sectionChanged = true;
			return { ...section, knowledgeUnits };
		});
		if (!sectionChanged) return lesson;
		changed = true;
		return { ...lesson, sections };
	});
	return changed ? { ...course, lessons } : course;
}
