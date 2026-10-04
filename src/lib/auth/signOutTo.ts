import { getCsrfToken } from 'next-auth/react';

import { isSafeInternalPath } from './safeRedirect';

/**
 * A document POST leaves the page before clearing the cookie, cancelling its pending session
 * fetches. A fetch-based signOut followed by navigation can let a late renewal restore it.
 */
export async function signOutTo(path: string): Promise<void> {
	const csrfToken = await getCsrfToken();
	if (!csrfToken) throw new Error('Could not prepare sign-out');
	const form = document.createElement('form');
	form.method = 'POST';
	form.action = '/api/auth/signout';
	form.hidden = true;
	const callbackUrl = new URL(isSafeInternalPath(path) ? path : '/', window.location.origin).href;
	for (const [name, value] of Object.entries({ csrfToken, callbackUrl })) {
		const input = document.createElement('input');
		input.type = 'hidden';
		input.name = name;
		input.value = value;
		form.append(input);
	}
	document.body.append(form);
	form.submit();
}
