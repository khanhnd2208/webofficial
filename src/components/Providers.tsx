'use client';

import { SessionProvider } from 'next-auth/react';

import {
	ContactDialogProvider,
	type ContactFormAvailability,
} from '@/components/contact/ContactDialogProvider';
import MotionProvider from '@/components/motion/MotionProvider';
import { ThemeProvider } from './ThemeProvider';

type ProvidersProps = {
	children: React.ReactNode;
	inquiryAvailability: ContactFormAvailability;
};

export default function Providers({ children, inquiryAvailability }: ProvidersProps) {
	return (
		<SessionProvider>
			<ThemeProvider>
				<MotionProvider>
					<ContactDialogProvider availability={inquiryAvailability}>
						{children}
					</ContactDialogProvider>
				</MotionProvider>
			</ThemeProvider>
		</SessionProvider>
	);
}
