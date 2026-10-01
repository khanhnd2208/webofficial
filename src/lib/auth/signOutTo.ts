import { signOut } from 'next-auth/react';

/**
 * Sign out, then load `path` on this same origin. Auth.js would build the redirect from AUTH_URL,
 * which is not always the host the visitor is on (previews, tests); a full load also clears every
 * page's cached session.
 */
export async function signOutTo(path: string): Promise<void> {
	await signOut({ redirect: false });
	window.location.assign(path);
}
