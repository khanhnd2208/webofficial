import { notFound, redirect } from 'next/navigation';

import { getCourseById } from '@/services/courseService';
import { listCourseUnits } from '@/services/courseUnitService';
import { listLessons } from '@/services/lessonService';

export const dynamic = 'force-dynamic';

/**
 * When user navigates to /courses/:courseId/units/:unitId,
 * redirect them to the first lesson in that unit.
 * No more intermediate "lesson list" page.
 */
export default async function UnitRedirectPage({
	params,
}: {
	params: Promise<{ courseId: string; unitId: string }>;
}) {
	const { courseId, unitId } = await params;

	const course = await getCourseById(courseId);
	if (!course) notFound();

	const courseUnits = await listCourseUnits({ courseId: course.id });
	const unitRow = courseUnits.find((cu) => cu.unitId === unitId);
	if (!unitRow) notFound();

	const lessons = await listLessons({ unitId, page: 1, limit: 1 });
	if (lessons.items.length === 0) {
		// No lessons — go back to course page
		redirect(`/courses/${encodeURIComponent(courseId)}`);
	}

	const firstLesson = lessons.items[0];
	redirect(
		`/courses/${encodeURIComponent(courseId)}/units/${encodeURIComponent(unitId)}/lessons/${encodeURIComponent(firstLesson.id)}`
	);
}
