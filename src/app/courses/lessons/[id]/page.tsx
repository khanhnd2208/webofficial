import { notFound, redirect } from 'next/navigation';

import { getCourseById } from '@/services/courseService';
import { listCourseUnits } from '@/services/courseUnitService';
import { getLessonById } from '@/services/lessonService';
import { getUnitById } from '@/services/unitService';

export const dynamic = 'force-dynamic';

/**
 * Legacy route: /courses/lessons/:id
 * Redirects to the new nested URL structure:
 * /courses/:courseId/units/:unitId/lessons/:lessonId
 */
export default async function LessonRedirectPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const lesson = await getLessonById(id);
	if (!lesson) notFound();

	const unit = lesson.unitId ? await getUnitById(lesson.unitId) : null;
	if (!unit) notFound();

	const allCourseUnits = await listCourseUnits({});
	const courseUnit = allCourseUnits.find((cu) => cu.unitId === unit.id);
	if (!courseUnit) notFound();

	const course = await getCourseById(courseUnit.courseId);
	if (!course) notFound();

	redirect(
		`/courses/${encodeURIComponent(course.id)}/units/${encodeURIComponent(unit.id)}/lessons/${encodeURIComponent(lesson.id)}`
	);
}
