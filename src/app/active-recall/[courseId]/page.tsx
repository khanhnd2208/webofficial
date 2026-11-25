import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import RecallCourseIndex from '@/components/active-recall/RecallCourseIndex';
import { getPublishedRecallCourse } from '@/features/active-recall';

export const dynamic = 'force-dynamic';

const getCourse = cache(getPublishedRecallCourse);
type PageProps = { params: Promise<{ courseId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const course = await getCourse((await params).courseId);
	return {
		title: course ? `Ôn tập · ${course.courseName}` : 'Ôn tập',
		robots: { index: false, follow: false },
	};
}

export default async function PublicCourseRecallPage({ params }: PageProps) {
	const { courseId } = await params;
	const course = await getCourse(courseId);
	if (!course) notFound();

	return (
		<RecallCourseIndex courseName={course.courseName} decks={course.decks} courseId={courseId} />
	);
}
