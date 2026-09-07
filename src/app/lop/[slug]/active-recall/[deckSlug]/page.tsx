import type { Metadata } from 'next';
import Link from 'next/link';
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
		<div className="min-h-svh bg-canvas">
			<div className="mx-auto w-[min(100%-2rem,74rem)] pt-6">
				<Link
					href={routes.teachingPublicClassTab(slug, 'recall')}
					className="text-sm font-semibold text-accent hover:underline"
				>
					← Active Recall của lớp
				</Link>
			</div>
			<ActiveRecallPlayer deck={deck} />
		</div>
	);
}
