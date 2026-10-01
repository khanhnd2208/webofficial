'use client';

import type { Session } from 'next-auth';
import { getSession, useSession } from 'next-auth/react';
import { useEffect, useRef } from 'react';

function sessionKey(session: Session | null | undefined): string {
	if (!session?.user) return 'signed-out';
	return `${session.user.email ?? session.user.id ?? ''}:${session.user.role ?? ''}`;
}

/**
 * Browsers restore Back/Forward pages from memory with the session they had then, so a page
 * seen before signing in would still say "Đăng nhập" (and next-auth never refetches a `null`
 * session). When such a page comes back, ask the server who is signed in and reload if it changed.
 */
export default function SessionFreshness() {
	const { data: session, status } = useSession();
	const known = useRef<string | null>(null);

	useEffect(() => {
		if (status !== 'loading') known.current = sessionKey(session);
	}, [session, status]);

	useEffect(() => {
		async function onPageShow(event: PageTransitionEvent) {
			if (!event.persisted || known.current === null) return;
			const fresh = await getSession({ broadcast: false });
			if (sessionKey(fresh) !== known.current) window.location.reload();
		}
		window.addEventListener('pageshow', onPageShow);
		return () => window.removeEventListener('pageshow', onPageShow);
	}, []);

	return null;
}
