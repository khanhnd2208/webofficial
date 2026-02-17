import type { Metadata, Viewport } from 'next';
import { Inter, Merriweather } from 'next/font/google';

import Navbar from '@/components/Navbar';
import Providers from '@/components/Providers';
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
  title: 'Website thầy giáo NDK',
  description: 'Website cá nhân & blog chia sẻ kiến thức của thầy giáo NDK.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} ${merriweather.variable} antialiased`}>
			<Providers>
				<Navbar />
				{children}
			</Providers>
      </body>
    </html>
  );
}
