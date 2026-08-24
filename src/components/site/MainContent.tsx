'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import RouteEntrance from '@/components/motion/RouteEntrance';
import { isFullBleedPublicPath, isInternalChromePath } from '@/config/navigation';

/**
 * Light entrance on public routes. Modest top inset on inner pages so GateBack
 * does not collide with titles. Intro, mục lục, My Space, and /lop stay full-bleed.
 */
export default function MainContent({ children }: { children: ReactNode }) {
	const pathname = usePathname();

	if (isInternalChromePath(pathname)) {
		return <div id="main-content">{children}</div>;
	}

	const fullBleed = isFullBleedPublicPath(pathname);

	return (
		<div id="main-content" className={fullBleed ? undefined : 'pt-14'}>
			<RouteEntrance key={pathname}>{children}</RouteEntrance>
		</div>
	);
}
