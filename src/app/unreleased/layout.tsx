import type { Viewport } from 'next';
import { Be_Vietnam_Pro, IBM_Plex_Mono, Space_Grotesk } from 'next/font/google';
import type { ReactNode } from 'react';

/* The event's own type: Space Grotesk for display, Be Vietnam Pro for reading, Plex Mono for labels. */
const display = Space_Grotesk({
	variable: '--font-ur-display',
	subsets: ['latin', 'vietnamese'],
	weight: ['500', '600', '700'],
	display: 'swap',
});

const body = Be_Vietnam_Pro({
	variable: '--font-ur-body',
	subsets: ['latin', 'vietnamese'],
	weight: ['400', '500', '600'],
	display: 'swap',
});

const mono = IBM_Plex_Mono({
	variable: '--font-ur-mono',
	subsets: ['latin', 'vietnamese'],
	weight: ['500'],
	display: 'swap',
});

export const viewport: Viewport = {
	colorScheme: 'dark',
};

export default function UnreleasedLayout({ children }: { children: ReactNode }) {
	return <div className={`${display.variable} ${body.variable} ${mono.variable}`}>{children}</div>;
}
