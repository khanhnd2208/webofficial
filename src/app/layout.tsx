import type { Metadata } from 'next';
import { Geist_Mono, Inter, Merriweather } from 'next/font/google';

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
  weight: ['300', '400', '700', '900'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

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
      <body className={`${inter.variable} ${merriweather.variable} ${geistMono.variable} antialiased`}>
			<Providers>
				<Navbar />
				{children}
			</Providers>
      </body>
    </html>
  );
}
