'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import RouteEntrance from '@/components/motion/RouteEntrance';
import JourneyTransition from './JourneyTransition';
import { isInternalChromePath } from '@/config/navigation';

/**
 * Light entrance on public routes. Intro and Mục lục play the journey transition;
 * workspaces with their own chrome get no entrance.
 */
export default function MainContent({ children }: { children: ReactNode }) {
	const pathname = usePathname();

	if (isInternalChromePath(pathname)) {
		return <div id="main-content">{children}</div>;
	}

	return (
		<div id="main-content">
			{pathname === '/' || pathname === '/muc-luc' ? (
				<JourneyTransition page={pathname}>{children}</JourneyTransition>
			) : (
				<RouteEntrance key={pathname}>{children}</RouteEntrance>
			)}
		</div>
	);
}
