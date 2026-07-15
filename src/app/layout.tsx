import type { Metadata, Viewport } from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';

import Navbar from '@/components/Navbar';
import Providers from '@/components/Providers';
import ConditionalFooter from '@/components/ConditionalFooter';
import MainContent from '@/components/MainContent';
import SkipLink from '@/components/SkipLink';
import AnalyticsScript from '@/components/AnalyticsScript';
import { SITE_CREATOR, SITE_DESCRIPTION, SITE_NAME, SITE_ORIGIN, absoluteUrl } from '@/config/site';
import './globals.css';

const inter = Inter({
	variable: '--font-inter',
	subsets: ['latin', 'vietnamese'],
});

const cormorantGaramond = Cormorant_Garamond({
	variable: '--font-cormorant',
	subsets: ['latin', 'vietnamese'],
	weight: 'variable',
	style: ['normal', 'italic'],
	display: 'swap',
});

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 5,
	themeColor: '#F7F5F0',
};

export const metadata: Metadata = {
	metadataBase: new URL(SITE_ORIGIN),
	title: {
		default: SITE_NAME,
		template: `%s | ${SITE_NAME}`,
	},
	description: SITE_DESCRIPTION,
	authors: [{ name: SITE_CREATOR, url: absoluteUrl('/') }],
	creator: SITE_CREATOR,
	openGraph: {
		siteName: SITE_NAME,
		locale: 'vi_VN',
		type: 'website',
		url: SITE_ORIGIN,
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="vi" className="light" suppressHydrationWarning>
			<body className={`${inter.variable} ${cormorantGaramond.variable} antialiased`}>
				<Providers>
					<SkipLink />
					<Navbar />
					<MainContent>{children}</MainContent>
					<ConditionalFooter />
					<AnalyticsScript />
				</Providers>
			</body>
		</html>
	);
}
