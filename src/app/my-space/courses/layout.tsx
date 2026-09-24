import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { routes } from '@/config/routes';
import { auth } from '@/lib/auth';
import { incomingLearnPath } from '@/lib/auth/incomingPath';

import '../../learn.css';

/** Courses are open to every signed-in account; editing stays admin-only per page. */
export default async function LearnCoursesLayout({ children }: { children: ReactNode }) {
	const session = await auth();
	if (!session?.user) {
		const from = await incomingLearnPath();
		redirect(`${routes.login}?from=${encodeURIComponent(from)}`);
	}
	return <div className="ln min-h-svh bg-canvas text-ink">{children}</div>;
}
