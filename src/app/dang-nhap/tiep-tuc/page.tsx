import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { routes } from '@/config/routes';
import { auth } from '@/lib/auth';
import { sanitizeAuthRedirect } from '@/lib/auth/safeRedirect';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'Đang mở tài khoản',
	robots: { index: false, follow: false },
};

/** Role-aware landing after a sign-in that had no specific destination. */
export default async function LoginContinuePage() {
	const session = await auth();
	if (!session?.user) redirect(routes.login);
	redirect(sanitizeAuthRedirect(undefined, { role: session.user.role }));
}
