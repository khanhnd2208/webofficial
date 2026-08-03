'use client';

import { SessionProvider } from 'next-auth/react';

import {
	ContactDialogProvider,
	type ContactFormAvailability,
} from '@/components/contact/ContactDialogProvider';
import MotionProvider from '@/components/motion/MotionProvider';

type ProvidersProps = {
	children: React.ReactNode;
	inquiryAvailability: ContactFormAvailability;
};

export default function Providers({ children, inquiryAvailability }: ProvidersProps) {
	return (
		<SessionProvider>
			<MotionProvider>
				<ContactDialogProvider availability={inquiryAvailability}>
					{children}
				</ContactDialogProvider>
			</MotionProvider>
		</SessionProvider>
	);
}
