import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import ActiveRecallPlayer from '@/components/active-recall/ActiveRecallPlayer';
import { getPublishedRecallDeckForClass } from '@/features/active-recall';
import { routes } from '@/config/routes';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string; deckSlug: string }>;
}): Promise<Metadata> {
	const { slug, deckSlug } = await params;
	const deck = await getPublishedRecallDeckForClass(slug, deckSlug);
	if (!deck) return {};
	return {
		title: `${deck.title} | Active Recall`,
		description: deck.description || `Bộ thẻ Active Recall: ${deck.title}`,
		robots: { index: false, follow: false, nocache: true },
	};
}

export default async function PublicClassRecallDeckPage({
	params,
}: {
	params: Promise<{ slug: string; deckSlug: string }>;
}) {
	const { slug, deckSlug } = await params;
	const deck = await getPublishedRecallDeckForClass(slug, deckSlug);
	if (!deck) notFound();
	return (
		<ActiveRecallPlayer
			deck={deck}
			backHref={routes.teachingPublicClassTab(slug, 'recall')}
			backLabel="Active Recall của lớp"
		/>
	);
}
