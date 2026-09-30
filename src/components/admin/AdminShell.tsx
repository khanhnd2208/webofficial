'use client';

import Link from 'next/link';
import styles from './AdminStudio.module.css';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import AdminSidebar from '@/app/admin/AdminSidebar';
import { AdminLocalNav } from '@/components/admin/AdminLocalNav';
import { ArchiveBanner } from '@/components/admin/ArchiveBanner';
import { resolveAdminRoute } from '@/config/adminNavigation';
import { routes } from '@/config/routes';
import { isArchivedAdminPath } from '@/config/moduleRegistry';

export default function AdminShell({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const meta = resolveAdminRoute(pathname);
	const archived = isArchivedAdminPath(pathname);

	return (
		<div
			className={`${styles.theme} ${styles.shell}`}
			data-testid="admin-shell"
			data-variant={archived ? 'archive' : 'main'}
		>
			<AdminSidebar />
			<div className="admin-content min-w-0 flex-1 overflow-auto" data-width={meta.width}>
				<div className={styles.topbar}>
					<span className="font-semibold">Admin Studio</span>
					<Link href={routes.toc} className={`${styles.button} ${styles.quiet}`}>
						Về Mục lục ↗
					</Link>
				</div>
				{archived ? <ArchiveBanner /> : null}
				{meta.localNav?.length ? (
					<AdminLocalNav items={meta.localNav} action={meta.localNavAction} />
				) : null}
				<main className="min-w-0">{children}</main>
			</div>
		</div>
	);
}
