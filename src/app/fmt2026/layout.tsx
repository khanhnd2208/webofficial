import type { Viewport } from 'next';
import type { ReactNode } from 'react';

export const viewport: Viewport = { colorScheme: 'dark' };

export default function Fmt2026Layout({ children }: { children: ReactNode }) {
	return children;
}
