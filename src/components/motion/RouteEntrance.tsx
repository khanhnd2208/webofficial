'use client';

import type { ReactNode } from 'react';

/**
 * Route transition shell. Content is always visible from SSR —
 * motion must never gate readability (no opacity:0 on first paint).
 */
export default function RouteEntrance({ children, className }: { children: ReactNode; className?: string }) {
	return <div className={className}>{children}</div>;
}
