import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AdminForbidden } from '@/components/admin/AdminForbidden';
import AdminShell from '@/components/admin/AdminShell';
import { routes } from '@/config/routes';
import { auth } from '@/lib/auth';
import { incomingAdminPath } from '@/lib/auth/incomingPath';
import { countNewInquiries } from '@/services/adminDashboardService';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	const session = await auth();
	const from = await incomingAdminPath();
	if (!session?.user) {
		redirect(`${routes.login}?from=${encodeURIComponent(from)}`);
	}
	if (session.user.role !== 'admin') {
		return <AdminForbidden from={from} />;
	}

	const [cookieStore, newInquiries] = await Promise.all([
		cookies(),
		// The badge is a hint; a database hiccup must not take the whole admin down.
		countNewInquiries().catch(() => 0),
	]);
	const sidebarCollapsed = cookieStore.get('admin-sidebar-collapsed')?.value === '1';
	return (
		<AdminShell sidebarCollapsed={sidebarCollapsed} newInquiries={newInquiries}>
			{children}
		</AdminShell>
	);
}
