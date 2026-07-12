import { redirect } from 'next/navigation';

import { routes } from '@/config/routes';
import { auth } from '@/lib/auth';

/**
 * Vocabulary is an admin-only tool.
 * Non-admin visitors are sent home; unauthenticated users go to login.
 */
export async function requireVocabAdminAccess() {
	const session = await auth();
	if (!session?.user) {
		redirect(`${routes.login}?from=${routes.admin.vocabulary}`);
	}
	if (session.user.role !== 'admin') {
		redirect(routes.home);
	}
	return session;
}
