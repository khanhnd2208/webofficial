import { redirect } from 'next/navigation';

import { hrefWithSearch } from '@/lib/navigation/hrefWithSearch';
import { routes } from '@/config/routes';

export default async function MySpaceTeachingRedirect({
	searchParams,
}: {
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
	redirect(hrefWithSearch(routes.admin.teaching, await searchParams));
}
