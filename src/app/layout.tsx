import type { Metadata, Viewport } from 'next';
import { Inter, Merriweather, Cinzel, Cormorant_Garamond } from 'next/font/google';

import Navbar from '@/components/Navbar';
import Providers from '@/components/Providers';
import ConditionalFooter from '@/components/ConditionalFooter';
import MainContent from '@/components/MainContent';
import SkipLink from '@/components/SkipLink';
import { SITE_DESCRIPTION, SITE_NAME, SITE_ORIGIN } from '@/config/site';
import './globals.css';

const inter = Inter({
	variable: '--font-inter',
	subsets: ['latin', 'vietnamese'],
});

const merriweather = Merriweather({
	variable: '--font-merriweather',
	subsets: ['latin', 'vietnamese'],
	weight: ['400', '700', '900'],
	display: 'swap',
});

const cinzel = Cinzel({
	variable: '--font-cinzel',
	subsets: ['latin'],
	weight: ['400', '600', '700', '900'],
	display: 'swap',
});

const cormorantGaramond = Cormorant_Garamond({
	variable: '--font-cormorant',
	subsets: ['latin', 'vietnamese'],
	weight: ['400', '500', '600', '700'],
	style: ['normal', 'italic'],
	display: 'swap',
});

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 5,
	themeColor: [
		{ media: '(prefers-color-scheme: light)', color: '#F2EEE6' },
		{ media: '(prefers-color-scheme: dark)', color: '#11100E' },
	],
};

export const metadata: Metadata = {
	metadataBase: new URL(SITE_ORIGIN),
	title: {
		default: SITE_NAME,
		template: `%s | ${SITE_NAME}`,
	},
	description: SITE_DESCRIPTION,
	openGraph: {
		siteName: SITE_NAME,
		locale: 'vi_VN',
		type: 'website',
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="vi" suppressHydrationWarning>
			<body
				className={`${inter.variable} ${merriweather.variable} ${cinzel.variable} ${cormorantGaramond.variable} antialiased`}
			>
				<Providers>
					<SkipLink />
					<Navbar />
					<MainContent>{children}</MainContent>
					<ConditionalFooter />
				</Providers>
			</body>
		</html>
	);
}
