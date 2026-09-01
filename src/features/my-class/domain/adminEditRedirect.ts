import { routes } from '@/config/routes';
import type { MyClassCourseDetail } from '@/features/my-class/types';

export function adminContentEditorHref(
	course: Pick<MyClassCourseDetail, 'id' | 'lessons'>,
	opts?: { lessonSlug?: string | null; unitSlug?: string | null; sectionSlug?: string | null },
): string {
	const base = routes.admin.myClassCourseContent(course.id);
	const lessonSlug = opts?.lessonSlug ?? null;
	const unitSlug = opts?.unitSlug ?? null;
	const sectionSlug = opts?.sectionSlug ?? null;

	if (unitSlug) {
		for (const lesson of course.lessons) {
			if (lessonSlug && lesson.slug !== lessonSlug) continue;
			for (const section of lesson.sections) {
				if (sectionSlug && section.slug !== sectionSlug) continue;
				const unit = section.knowledgeUnits.find((item) => item.slug === unitSlug);
				if (unit) return `${base}?node=unit:${unit.id}`;
			}
		}
	}

	if (lessonSlug) {
		const lesson = course.lessons.find((item) => item.slug === lessonSlug);
		if (lesson) return `${base}?node=lesson:${lesson.id}`;
	}

	return base;
}
