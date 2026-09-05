import type { Metadata } from 'next';

import MySpaceGrid from '@/components/myspace/MySpaceGrid';
import { routes } from '@/config/routes';
import { absoluteUrl } from '@/config/site';
import { getMySpaceTiles, mySpacePage } from '@/content/mySpace';
import { auth } from '@/lib/auth';

export const metadata: Metadata = {
	title: mySpacePage.title,
	description: mySpacePage.lead,
	alternates: { canonical: absoluteUrl(routes.mySpace) },
};

/**
 * My Space — focused hub for Teaching, Active Recall, and Admin for privileged accounts.
 * Full-bleed centered composition; back + contact live in PublicMinimalChrome.
 */
export default async function MySpacePage() {
	const session = await auth();
	const tiles = getMySpaceTiles(session?.user?.role);

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
