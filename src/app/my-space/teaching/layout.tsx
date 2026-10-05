import type { ReactNode } from 'react';
import { SurfaceTheme } from '@/components/ui/SurfaceTheme';
import { redirect } from 'next/navigation';

import { AdminForbidden } from '@/components/admin/AdminForbidden';
import SiteAuthChip from '@/components/site/SiteAuthChip';
import { TeachingPopoverRoot } from '@/components/teaching/TeachingPopover';
import { routes } from '@/config/routes';
import { auth } from '@/lib/auth';
import { incomingTeachingPath } from '@/lib/auth/incomingPath';

export default async function MySpaceTeachingLayout({ children }: { children: ReactNode }) {
	const session = await auth();
	const from = await incomingTeachingPath();
	if (!session?.user) {
		redirect(`${routes.login}?from=${encodeURIComponent(from)}`);
	}
	if (session.user.role !== 'admin') {
		return <AdminForbidden area="Teaching" from={from} />;
	}

	return (
		<SurfaceTheme surface="teaching" className="mc mc-studio min-h-svh bg-canvas text-ink">
			<TeachingPopoverRoot>
				{/* The shared account menu (name, Admin badge, sign-out) above every Teaching screen. */}
				<div className="mx-auto flex w-full max-w-[92rem] justify-end px-4 pt-2 sm:px-6">
					<SiteAuthChip variant="bar" />
				</div>
				<main className="mx-auto w-full max-w-[92rem] px-4 sm:px-6">{children}</main>
			</TeachingPopoverRoot>
		</SurfaceTheme>
	);
}
