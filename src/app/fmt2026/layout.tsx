import type { Viewport } from 'next';
import { Be_Vietnam_Pro, Lexend } from 'next/font/google';
import type { ReactNode } from 'react';
import { BOOTH } from '@/features/fmt2026/components/boothPalette';

const display = Lexend({
	variable: '--font-fmt-display',
	subsets: ['latin', 'vietnamese'],
	weight: ['700', '800'],
	display: 'swap',
});

const body = Be_Vietnam_Pro({
	variable: '--font-fmt-body',
	subsets: ['latin', 'vietnamese'],
	weight: ['500', '600', '700', '800'],
	display: 'swap',
});

export const viewport: Viewport = { colorScheme: 'dark', themeColor: BOOTH.night };

export default function Fmt2026Layout({ children }: { children: ReactNode }) {
	return <div className={`${display.variable} ${body.variable}`}>{children}</div>;
}
