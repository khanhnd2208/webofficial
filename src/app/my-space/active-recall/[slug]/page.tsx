import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { routes } from '@/config/routes';
import RecallTestYourself from '@/components/active-recall/test-yourself/RecallTestYourself';
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
	searchParams,
}: {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ mode?: string | string[] }>;
}) {
	const { slug } = await params;
	const deck = await getPublishedRecallDeck(slug);
	if (!deck) notFound();
	if ((await searchParams).mode === 'test') {
		return (
			<RecallTestYourself
				title={deck.subject}
				decks={[deck]}
				initialDeckSlug={deck.slug}
				backHref={routes.activeRecallDeck(deck.slug)}
				backLabel="Về thẻ ôn tập"
			/>
		);
	}
	return (
		<ActiveRecallPlayer
			deck={deck}
			showViToggle
			testHref={routes.activeRecallDeckTest(deck.slug)}
		/>
	);
}
