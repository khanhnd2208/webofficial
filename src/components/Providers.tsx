'use client';

import { SessionProvider } from 'next-auth/react';

import MotionProvider from '@/components/motion/MotionProvider';
import { ThemeProvider } from './ThemeProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<SessionProvider>
			<ThemeProvider>
				<MotionProvider>{children}</MotionProvider>
			</ThemeProvider>
		</SessionProvider>
	);
}
