import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import ActiveRecallPlayer from '@/components/active-recall/ActiveRecallPlayer';
import { routes } from '@/config/routes';
import { getPublishedRecallDeckForCourse } from '@/features/active-recall';

export const dynamic = 'force-dynamic';

const getDeck = cache(getPublishedRecallDeckForCourse);
type PageProps = { params: Promise<{ courseId: string; deckSlug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { courseId, deckSlug } = await params;
	const deck = await getDeck(courseId, deckSlug);
	return {
		title: deck ? `${deck.studyDeck.title} | Active Recall` : 'Active Recall',
		description: deck?.description || undefined,
		robots: { index: false, follow: false },
	};
}

export default async function PublicCourseRecallDeckPage({ params }: PageProps) {
	const { courseId, deckSlug } = await params;
	const deck = await getDeck(courseId, deckSlug);
	if (!deck) notFound();

	return (
		<ActiveRecallPlayer
			deck={deck.studyDeck}
			backHref={routes.publicCourseRecall(courseId)}
			backLabel="Các bộ thẻ của môn"
			showViToggle
		/>
	);
}
