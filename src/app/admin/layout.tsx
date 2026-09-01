import { redirect } from 'next/navigation';

import { AdminForbidden } from '@/components/admin/AdminForbidden';
import AdminShell from '@/components/admin/AdminShell';
import { routes } from '@/config/routes';
import { auth } from '@/lib/auth';
import { incomingAdminPath } from '@/lib/auth/incomingPath';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	const session = await auth();
	if (!session?.user) {
		const from = await incomingAdminPath();
		redirect(`${routes.login}?from=${encodeURIComponent(from)}`);
	}
	if (session.user.role !== 'admin') {
		return <AdminForbidden />;
	}

	return <AdminShell>{children}</AdminShell>;
}
