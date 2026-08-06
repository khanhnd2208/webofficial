import { redirect } from 'next/navigation';

import { routes } from '@/config/routes';

/**
 * Detail page retired — all briefing lives on /my-space/tests.
 * Keep this route as a redirect so old bookmarks still work.
 */
export default async function MySpaceTestDetailRedirect({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	redirect(routes.mySpaceTestPlay(slug));
}
