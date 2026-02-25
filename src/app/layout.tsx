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
  // metadataBase anchors all relative URLs to production domain.
  // Also eliminates the ⚠ localhost:4000 warning that causes Auth.js
  // to derive the wrong "salt" URL when verifying the PKCE code_verifier
  // on the Google OAuth callback — fixing the InvalidCheck error.
  metadataBase: new URL(
    process.env.NODE_ENV === 'production'
      ? 'https://toiladuykhanh.com'
      : 'http://localhost:3000'
  ),
  title: 'HANOICAM',
  description: 'HANOICAM — by NDK.',
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
