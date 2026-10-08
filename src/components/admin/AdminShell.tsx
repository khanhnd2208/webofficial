'use client';

import styles from './AdminStudio.module.css';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import AdminSidebar from '@/app/admin/AdminSidebar';
import { AdminLocalNav } from '@/components/admin/AdminLocalNav';
import { ArchiveBanner } from '@/components/admin/ArchiveBanner';
import { resolveAdminRoute } from '@/config/adminNavigation';
import { isArchivedAdminPath } from '@/config/moduleRegistry';

export default function AdminShell({
	children,
	sidebarCollapsed = false,
	newInquiries = 0,
}: {
	children: ReactNode;
	sidebarCollapsed?: boolean;
	newInquiries?: number;
}) {
	const pathname = usePathname();
	const meta = resolveAdminRoute(pathname);
	const archived = isArchivedAdminPath(pathname);

	return (
		<div
			className={`${styles.theme} ${styles.shell}`}
			data-testid="admin-shell"
			data-variant={archived ? 'archive' : 'main'}
		>
			<AdminSidebar initialCollapsed={sidebarCollapsed} newInquiries={newInquiries} />
			<div className="admin-content min-w-0 flex-1 overflow-auto" data-width={meta.width}>
				{archived ? <ArchiveBanner /> : null}
				{meta.localNav?.length ? (
					<AdminLocalNav items={meta.localNav} action={meta.localNavAction} />
				) : null}
				<main className="min-w-0">{children}</main>
			</div>
		</div>
	);
}
