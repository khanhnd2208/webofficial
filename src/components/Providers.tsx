'use client';

import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import { ThemeProvider } from './ThemeProvider';

export default function Providers({
	children,
	session,
}: {
	children: React.ReactNode;
	session: Session | null;
}) {
	return (
		<SessionProvider session={session} refetchOnWindowFocus={false}>
			<ThemeProvider>
				{children}
			</ThemeProvider>
		</SessionProvider>
	);
}
