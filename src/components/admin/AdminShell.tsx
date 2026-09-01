'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import AdminSidebar from '@/app/admin/AdminSidebar';
import { AdminLocalNav } from '@/components/admin/AdminLocalNav';
import { resolveAdminRoute } from '@/config/adminNavigation';

export default function AdminShell({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const meta = resolveAdminRoute(pathname);

	return (
		<div className="flex min-h-screen flex-col bg-background md:flex-row">
			<AdminSidebar />
			<div
				className="admin-content min-w-0 flex-1 overflow-auto"
				data-width={meta.width}
			>
				{meta.localNav?.length ? (
					<AdminLocalNav items={meta.localNav} action={meta.localNavAction} />
				) : null}
				<main className="min-w-0">{children}</main>
			</div>
		</div>
	);
}
