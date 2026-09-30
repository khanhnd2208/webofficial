'use client';

import { LocaleProvider } from '@/features/board-game-shared/components/i18n/LocaleProvider';
import { ThemeProvider } from '@/features/board-game-shared/components/theme/ThemeProvider';
import { ToastProvider } from '@/features/board-game-shared/components/ui/Toast';

export default function BoardGameLayout({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider>
			<LocaleProvider>
				<ToastProvider>{children}</ToastProvider>
			</LocaleProvider>
		</ThemeProvider>
	);
}
