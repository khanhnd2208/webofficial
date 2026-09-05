import { redirect } from 'next/navigation';

import { routes } from '@/config/routes';
import { hrefWithSearch } from '@/lib/navigation/hrefWithSearch';

export const dynamic = 'force-dynamic';

export default async function TeachingSettingsPage({
	params,
	searchParams,
}: {
	params: Promise<{ classId: string }>;
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
	const { classId } = await params;
	redirect(hrefWithSearch(routes.mySpaceTeachingClassTab(classId, 'setup'), await searchParams));
}
