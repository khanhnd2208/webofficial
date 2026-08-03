'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import RouteEntrance from '@/components/motion/RouteEntrance';

/**
 * Light entrance on public/learner routes. Fixed header offset via padding.
 * Admin skipped (no cinematic).
 */
export default function MainContent({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const skip = ['/admin', '/m/', '/messages', '/vocabulary', '/tai-khoan', '/dang-nhap', '/hoc/'].some(
		(prefix) => pathname.startsWith(prefix),
	);
	const isHome = pathname === '/';

	if (skip || isHome) {
		return <div id="main-content">{children}</div>;
	}

	return (
		<div id="main-content" className="pt-[var(--header-height)]">
			<RouteEntrance key={pathname}>{children}</RouteEntrance>
		</div>
	);
}
