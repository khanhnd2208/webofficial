import { signIn } from 'next-auth/react';

import { sanitizeAuthRedirect } from './safeRedirect';

/** Leave account selection to Google unless the person explicitly switches accounts. */
export function startGoogleSignIn(
	destination: string,
	{ chooseAccount = false }: { chooseAccount?: boolean } = {},
) {
	return signIn(
		'google',
		{ redirectTo: sanitizeAuthRedirect(destination) },
		chooseAccount ? { prompt: 'select_account' } : undefined,
	);
}
