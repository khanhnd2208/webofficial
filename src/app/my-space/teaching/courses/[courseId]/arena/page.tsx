import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { RecallArena } from '@/components/teaching/arena/RecallArena';
import { getRecallArena } from '@/features/teaching';
import { AppError } from '@/lib/appError';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'Kiểm tra bài cũ',
	robots: { index: false, follow: false },
};

/**
 * Projector screen for a whole course: the lecturer ticks the classes in the
 * room, adds make-up students from other classes, ticks the lessons to ask,
 * and the monster calls students one by one.
 */
export default async function MySpaceTeachingCourseArenaPage({
	params,
	searchParams,
}: {
	params: Promise<{ courseId: string }>;
	searchParams?: Promise<{ class?: string | string[] }>;
}) {
	const { courseId } = await params;
	const requested = (await searchParams)?.class;
	let data: Awaited<ReturnType<typeof getRecallArena>>;
	try {
		data = await getRecallArena(courseId);
	} catch (error) {
		if (error instanceof AppError && error.status === 404) notFound();
		throw error;
	}
	const initialClassId = typeof requested === 'string' ? requested : null;
	return <RecallArena data={data} initialClassId={initialClassId} />;
}
