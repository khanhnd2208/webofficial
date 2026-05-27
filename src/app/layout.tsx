import type { Metadata, Viewport } from 'next';
import { Inter, Merriweather, Cinzel, Cormorant_Garamond } from 'next/font/google';

import { auth } from '@/lib/auth';
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

// Mystical / arcane heading font — elegant small-caps, used in Lucky Card tool
const cinzel = Cinzel({
  variable: '--font-cinzel',
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  display: 'swap',
});

// Elegant serif for revealed card content — richer than Georgia
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} ${merriweather.variable} ${cinzel.variable} ${cormorantGaramond.variable} antialiased`}>
			<Providers session={session}>
				<Navbar />
				{children}
			</Providers>
      </body>
    </html>
  );
}
