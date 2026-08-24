import { redirect } from 'next/navigation';

import { routes } from '@/config/routes';

export const dynamic = 'force-dynamic';

export default async function TeachingGradebookPage({ params }: { params: Promise<{ classId: string }> }) {
	const { classId } = await params;
	redirect(routes.mySpaceTeachingClassTab(classId, 'attendance'));
}
