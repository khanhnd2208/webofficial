'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

/** Public site is light-only — no theme toggle / dark mode. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
	return (
		<NextThemesProvider
			attribute="class"
			defaultTheme="light"
			forcedTheme="light"
			enableSystem={false}
			disableTransitionOnChange
		>
			{children}
		</NextThemesProvider>
	);
}
