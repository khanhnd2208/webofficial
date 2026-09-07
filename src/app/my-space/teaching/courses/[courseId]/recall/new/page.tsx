import ActiveRecallEditor from '@/components/active-recall/ActiveRecallEditor';
import { routes } from '@/config/routes';
import { getTeachingCourse } from '@/features/teaching';
import { AppError } from '@/lib/appError';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NewCourseRecallPage({
	params,
}: {
	params: Promise<{ courseId: string }>;
}) {
	const { courseId } = await params;
	let course: Awaited<ReturnType<typeof getTeachingCourse>>;
	try {
		course = await getTeachingCourse(courseId);
	} catch (error) {
		if (error instanceof AppError && error.status === 404) notFound();
		throw error;
	}
	if (course.status === 'ARCHIVED') {
		redirect(routes.mySpaceTeachingCourseTab(course.id, 'recall'));
	}
	return <ActiveRecallEditor initialDeck={null} courseId={course.id} courseName={course.courseName} />;
}
