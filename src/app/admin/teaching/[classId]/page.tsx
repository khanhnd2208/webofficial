import { routes } from '@/config/routes';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function TeachingClassIndexPage({
	params,
	searchParams,
}: {
	params: Promise<{ classId: string }>;
	searchParams?: Promise<{ tab?: string }>;
}) {
	const { classId } = await params;
	const tab = (await searchParams)?.tab ?? 'attendance';
	redirect(routes.mySpaceTeachingClassTab(classId, tab));
}
