'use client';

import { SessionProvider } from 'next-auth/react';

import MotionProvider from '@/components/motion/MotionProvider';

type ProvidersProps = {
	children: React.ReactNode;
	/** Kept for layout compatibility; contact form reads availability on the page. */
	inquiryAvailability?: unknown;
};

export default function Providers({ children }: ProvidersProps) {
	return (
		<SessionProvider>
			<MotionProvider>{children}</MotionProvider>
		</SessionProvider>
	);
}
