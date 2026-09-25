'use client';

import { LocaleProvider } from '@/features/spy-fall/components/i18n/LocaleProvider';
import { ThemeProvider } from '@/features/spy-fall/components/theme/ThemeProvider';
import { ToastProvider } from '@/features/spy-fall/components/ui/Toast';

export default function BoardGameLayout({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider>
			<LocaleProvider>
				<ToastProvider>{children}</ToastProvider>
			</LocaleProvider>
		</ThemeProvider>
	);
}
