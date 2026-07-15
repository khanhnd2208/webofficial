/**
 * Boutique route entrance — ~450ms opacity fade when motion is allowed.
 * Content is visible immediately on SSR (no opacity:0 first paint).
 */
'use client';

import { m, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

import { useMotionTier } from './MotionProvider';
import { duration, ease } from './tokens';

export default function RouteEntrance({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	const { tier } = useMotionTier();
	const reduce = useReducedMotion();

	if (reduce || tier === 'reduced') {
		return <div className={className}>{children}</div>;
	}

	return (
		<m.div
			className={className}
			initial={{ opacity: 0.92 }}
			animate={{ opacity: 1 }}
			transition={{ duration: duration.page, ease: ease.reveal }}
		>
			{children}
		</m.div>
	);
}
