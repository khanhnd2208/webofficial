import type { Metadata } from 'next';

import { RecallArena } from '@/components/teaching/arena/RecallArena';
import { getRecallArena } from '@/features/teaching';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'Kiểm tra bài cũ',
	robots: { index: false, follow: false },
};

/** Projector screen: the monster calls students who are in the room and asks a recall card. */
export default async function MySpaceTeachingArenaPage({
	params,
}: {
	params: Promise<{ classId: string }>;
}) {
	const { classId } = await params;
	return <RecallArena data={await getRecallArena(classId)} />;
}
