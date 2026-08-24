import { redirect } from 'next/navigation';

import { routes } from '@/config/routes';

export const dynamic = 'force-dynamic';

export default async function TeachingAttendanceBoardAdminPage({
	params,
}: {
	params: Promise<{ classId: string }>;
}) {
	const { classId } = await params;
	redirect(routes.mySpaceTeachingClassTab(classId, 'share'));
}
