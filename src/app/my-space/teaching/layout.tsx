import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { TeachingPopoverRoot } from '@/components/teaching/TeachingPopover';
import { routes } from '@/config/routes';
import { auth } from '@/lib/auth';
import { incomingTeachingPath } from '@/lib/auth/incomingPath';

export default async function MySpaceTeachingLayout({ children }: { children: ReactNode }) {
	const session = await auth();
	if (!session?.user) {
		const from = await incomingTeachingPath();
		redirect(`${routes.login}?from=${encodeURIComponent(from)}`);
	}
	if (session.user.role !== 'admin') {
		redirect(routes.mySpace);
	}

	return (
		<div className="mc mc-studio min-h-svh bg-canvas text-ink">
			<TeachingPopoverRoot>
				<main className="mx-auto w-full max-w-[92rem] px-4 sm:px-6">{children}</main>
			</TeachingPopoverRoot>
		</div>
	);
}
