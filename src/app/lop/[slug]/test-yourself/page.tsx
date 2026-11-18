import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import RecallTestYourself from '@/components/active-recall/test-yourself/RecallTestYourself';
import { routes } from '@/config/routes';
import { getRecallTestForClass } from '@/features/active-recall';

export const dynamic = 'force-dynamic';

const getSource = cache(getRecallTestForClass);
type PageProps = {
	params: Promise<{ slug: string }>;
	searchParams: Promise<{ deck?: string | string[] }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const source = await getSource((await params).slug);
	return {
		title: source ? `Test yourself · ${source.title}` : 'Test yourself',
		robots: { index: false, follow: false, nocache: true },
	};
}

export default async function ClassRecallTestPage({ params, searchParams }: PageProps) {
	const [{ slug }, { deck }] = await Promise.all([params, searchParams]);
	const source = await getSource(slug);
	if (!source) notFound();

	return (
		<RecallTestYourself
			title={source.title}
			decks={source.decks}
			initialDeckSlug={typeof deck === 'string' ? deck : undefined}
			backHref={routes.teachingPublicClassTab(slug, 'recall')}
			backLabel="Ôn tập của lớp"
		/>
	);
}
