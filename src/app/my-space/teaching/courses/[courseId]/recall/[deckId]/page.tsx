import { notFound } from 'next/navigation';

import ActiveRecallEditor from '@/components/active-recall/ActiveRecallEditor';
import { getAdminRecallDeck } from '@/features/active-recall';
import { getTeachingCourse } from '@/features/teaching';
import { AppError } from '@/lib/appError';

export const dynamic = 'force-dynamic';

export default async function EditCourseRecallPage({
	params,
}: {
	params: Promise<{ courseId: string; deckId: string }>;
}) {
	const { courseId, deckId } = await params;
	let course: Awaited<ReturnType<typeof getTeachingCourse>>;
	try {
		course = await getTeachingCourse(courseId);
	} catch (error) {
		if (error instanceof AppError && error.status === 404) notFound();
		throw error;
	}
	const deck = await getAdminRecallDeck(deckId);
	if (!deck || deck.courseId !== course.id) notFound();
	return (
		<ActiveRecallEditor initialDeck={deck} courseId={course.id} courseName={course.courseName} />
	);
}
