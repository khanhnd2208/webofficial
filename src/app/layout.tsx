import type { Metadata, Viewport } from 'next';
import { Inter, Source_Serif_4 } from 'next/font/google';

import Providers from '@/components/Providers';
import {
	AnalyticsScript,
	ConditionalFooter,
	MainContent,
	Navbar,
	SkipLink,
} from '@/components/site';
import { SITE_CREATOR, SITE_DESCRIPTION, SITE_NAME, SITE_ORIGIN, absoluteUrl } from '@/config/site';
import { getInquiryAvailability } from '@/lib/inquiryAvailability';
import './globals.css';

const inter = Inter({
	variable: '--font-inter',
	subsets: ['latin', 'vietnamese'],
});

const sourceSerif = Source_Serif_4({
	variable: '--font-serif-display',
	subsets: ['latin', 'vietnamese'],
	weight: 'variable',
	style: ['normal', 'italic'],
	display: 'swap',
});

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 5,
	themeColor: '#F8F7F4',
};

export const metadata: Metadata = {
	metadataBase: new URL(SITE_ORIGIN),
	title: {
		default: 'Duy Khánh — Thiết kế học tập quản trị và đào tạo ứng dụng AI',
		template: `%s | ${SITE_NAME}`,
	},
	description: SITE_DESCRIPTION,
	authors: [{ name: SITE_CREATOR, url: absoluteUrl('/') }],
	creator: SITE_CREATOR,
	openGraph: {
		title: 'Duy Khánh — Thiết kế học tập quản trị và đào tạo ứng dụng AI',
		description: SITE_DESCRIPTION,
		siteName: SITE_NAME,
		locale: 'vi_VN',
		type: 'website',
		url: SITE_ORIGIN,
		images: [
			{
				url: absoluteUrl('/og-editorial-premium.png'),
				width: 1734,
				height: 907,
				alt: 'Duy Khánh — Học để hiểu sâu. Làm để tạo thay đổi.',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Duy Khánh — Thiết kế học tập quản trị và đào tạo ứng dụng AI',
		description: SITE_DESCRIPTION,
		images: [absoluteUrl('/og-editorial-premium.png')],
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const inquiryAvailability = getInquiryAvailability();

	return (
		<html lang="vi" className="light" data-scroll-behavior="smooth" suppressHydrationWarning>
			<body className={`${inter.variable} ${sourceSerif.variable} antialiased`}>
				<Providers inquiryAvailability={inquiryAvailability}>
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
