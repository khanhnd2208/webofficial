import { notFound, redirect } from 'next/navigation';

import { routes } from '@/config/routes';
import { getRecallArenaCourseId } from '@/features/teaching';
import { AppError } from '@/lib/appError';

export const dynamic = 'force-dynamic';

/** The arena moved to the course: keep old class links working, with that class ticked. */
export default async function MySpaceTeachingClassArenaRedirect({
	params,
}: {
	params: Promise<{ classId: string }>;
}) {
	const { classId } = await params;
	let courseId: string;
	try {
		courseId = await getRecallArenaCourseId(classId);
	} catch (error) {
		if (error instanceof AppError && error.status === 404) notFound();
		throw error;
	}
	redirect(routes.mySpaceTeachingArena(courseId, classId));
}
