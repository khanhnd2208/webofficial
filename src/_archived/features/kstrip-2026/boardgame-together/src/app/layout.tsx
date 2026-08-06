import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google';

import { LocaleProvider } from '@/components/i18n/LocaleProvider';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';

import './globals.css';

const inter = Inter({
	variable: '--font-inter',
	subsets: ['latin', 'vietnamese'],
});

const spaceGrotesk = Space_Grotesk({
	variable: '--font-space-grotesk',
	subsets: ['latin', 'vietnamese'],
	weight: ['500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
	variable: '--font-jetbrains-mono',
	subsets: ['latin', 'vietnamese'],
	weight: ['500', '700'],
});

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 5,
	themeColor: [
		{ media: '(prefers-color-scheme: light)', color: '#f0ece4' },
		{ media: '(prefers-color-scheme: dark)', color: '#121110' },
	],
};

export const metadata: Metadata = {
	title: "K'sTrip — Amazing Boardgames & Trip Hub",
	description:
		'Hub du lịch và giải trí — party game, lên kế hoạch chuyến đi và nhiều hơn nữa.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="vi" suppressHydrationWarning>
			<body
				className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground`}
			>
				<ThemeProvider>
					<LocaleProvider>
						<ToastProvider>{children}</ToastProvider>
					</LocaleProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
