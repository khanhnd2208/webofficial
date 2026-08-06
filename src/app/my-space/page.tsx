import type { Metadata } from 'next';

import MySpaceGrid from '@/components/myspace/MySpaceGrid';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { mySpacePage, mySpaceTiles } from '@/content/mySpace';

export const metadata: Metadata = {
	title: mySpacePage.title,
	description: mySpacePage.lead,
	alternates: { canonical: absoluteUrl(routes.mySpace) },
};

/**
 * My Space — personal experiments hub.
 * Full-bleed centered composition; back + contact live in PublicMinimalChrome.
 */
export default function MySpacePage() {
	return (
		<main
			className="flex min-h-svh flex-col items-center justify-start bg-canvas px-6 pt-24 pb-28 sm:justify-center sm:px-8 sm:py-24"
			data-testid="my-space"
		>
			<header className="sr-only">
				<h1>{mySpacePage.title}</h1>
				<p>{mySpacePage.lead}</p>
			</header>
			<MySpaceGrid tiles={mySpaceTiles} />
		</main>
	);
}
