import { redirect } from 'next/navigation';

import { routes } from '@/config/routes';

type AttendanceBoardRedirectProps = {
	params: Promise<{ slug: string }>;
};

export const dynamic = 'force-dynamic';

export default async function PublicAttendanceBoardRedirectPage({
	params,
}: AttendanceBoardRedirectProps) {
	const { slug } = await params;
	redirect(routes.teachingPublicClass(slug));
}
