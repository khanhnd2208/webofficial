import { notFound } from 'next/navigation';

import { courseService } from '@/features/courses';
import { AppError } from '@/lib/appError';

import LessonEditor from './LessonEditor';

export const dynamic = 'force-dynamic';

export const metadata = {
	title: 'Biên soạn bài học | Admin',
};

export default async function AdminLessonEditPage({
	params,
}: {
	params: Promise<{ id: string; lessonId: string }>;
}) {
	const { id: courseId, lessonId } = await params;
	let initial;
	try {
		initial = await courseService.getAdminLessonForEditor(lessonId, courseId);
	} catch (error) {
		if (error instanceof AppError && error.status === 404) notFound();
		throw error;
	}

	return <LessonEditor courseId={courseId} initial={initial} />;
}
