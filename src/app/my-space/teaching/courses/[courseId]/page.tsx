import { notFound } from 'next/navigation';

import { TeachingCourseWorkspace } from '@/components/teaching/admin/TeachingCourseWorkspace';
import { listAdminRecallDecksForCourse } from '@/features/active-recall';
import { getTeachingCourseWorkspace } from '@/features/teaching';
import { AppError } from '@/lib/appError';

export const dynamic = 'force-dynamic';

export default async function TeachingCoursePage({
	params,
	searchParams,
}: {
	params: Promise<{ courseId: string }>;
	searchParams?: Promise<{ tab?: string }>;
}) {
	const { courseId } = await params;
	const tab = (await searchParams)?.tab === 'recall' ? 'recall' : 'classes';
	let course: Awaited<ReturnType<typeof getTeachingCourseWorkspace>>;
	try {
		course = await getTeachingCourseWorkspace(courseId);
	} catch (error) {
		if (error instanceof AppError && error.status === 404) notFound();
		throw error;
	}
	const decks = await listAdminRecallDecksForCourse(courseId);
	return <TeachingCourseWorkspace course={course} decks={decks} tab={tab} />;
}
