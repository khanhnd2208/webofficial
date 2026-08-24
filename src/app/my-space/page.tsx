import type { Metadata } from 'next';

import MySpaceGrid from '@/components/myspace/MySpaceGrid';
import { isPublicLearningFeatureEnabled } from '@/config/publicFeatureAccess';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { mySpacePage, mySpaceTiles, type MySpaceTile } from '@/content/mySpace';
import { auth } from '@/lib/auth';

export const metadata: Metadata = {
	title: mySpacePage.title,
	description: mySpacePage.lead,
	alternates: { canonical: absoluteUrl(routes.mySpace) },
};

/**
 * My Space — personal experiments hub.
 * Full-bleed centered composition; back + contact live in PublicMinimalChrome.
 */
export default async function MySpacePage() {
	const session = await auth();
	const publicTiles = mySpaceTiles.map((tile) => {
		const locked =
			(tile.id === 'tests' && !isPublicLearningFeatureEnabled('tests')) ||
			(tile.id === 'my-class' && !isPublicLearningFeatureEnabled('knowledge'));
		return locked ? { ...tile, status: 'coming-soon' as const, href: undefined } : tile;
	});
	const tiles: MySpaceTile[] = [
		...publicTiles,
		...(session?.user?.role === 'admin'
			? [{
					id: 'teaching',
					label: 'Teaching',
					image: { src: '/brand/myspace/my-class.svg', alt: 'Minh họa khu quản lý Teaching' },
					status: 'published' as const,
					href: routes.mySpaceTeaching,
				}]
			: []),
	];
	return (
		<main
			className="flex min-h-svh flex-col items-center justify-start bg-canvas px-6 pt-24 pb-28 sm:justify-center sm:px-8 sm:py-24"
			data-testid="my-space"
		>
			<header className="sr-only">
				<h1>{mySpacePage.title}</h1>
				<p>{mySpacePage.lead}</p>
			</header>
			<MySpaceGrid tiles={tiles} />
		</main>
	);
}
