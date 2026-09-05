import { redirect } from 'next/navigation';

import { routes } from '@/config/routes';
import { hrefWithSearch } from '@/lib/navigation/hrefWithSearch';

export default async function LegacyTeachingNewRedirect({
	searchParams,
}: {
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
	redirect(hrefWithSearch(routes.mySpaceTeachingNew, await searchParams));
}
