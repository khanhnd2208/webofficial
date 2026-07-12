'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import RouteEntrance from '@/components/motion/RouteEntrance';

/**
 * Light entrance on public/learner routes. No exit animation — never blocks navigation.
 * Admin skipped (no cinematic).
 */
export default function MainContent({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const skip = pathname.startsWith('/admin');

	if (skip) {
		return <div id="main-content">{children}</div>;
	}

	return (
		<div id="main-content">
			<RouteEntrance key={pathname}>{children}</RouteEntrance>
		</div>
	);
}
