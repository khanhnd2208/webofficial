import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import ActiveRecallPlayer from '@/components/active-recall/ActiveRecallPlayer';
import { getPublishedRecallDeck } from '@/features/active-recall';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const deck = await getPublishedRecallDeck(slug);
	if (!deck) return {};
	return {
		title: `${deck.title} | Active Recall`,
		description: deck.description || `Bộ thẻ Active Recall: ${deck.title}`,
	};
}

export default async function ActiveRecallDeckPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const deck = await getPublishedRecallDeck(slug);
	if (!deck) notFound();
	// Older shared links point here; keep them on the same bilingual player as class links.
	return <ActiveRecallPlayer deck={deck} showViToggle />;
}
