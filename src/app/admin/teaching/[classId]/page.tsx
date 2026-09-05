import { redirect } from 'next/navigation';

import { routes } from '@/config/routes';
import { hrefWithSearch } from '@/lib/navigation/hrefWithSearch';

export default async function LegacyTeachingClassRedirect({
	params,
	searchParams,
}: {
	params: Promise<{ classId: string }>;
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
	const { classId } = await params;
	redirect(hrefWithSearch(routes.mySpaceTeachingClass(classId), await searchParams));
}
