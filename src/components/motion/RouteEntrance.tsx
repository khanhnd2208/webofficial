/**
 * Boutique route entrance — soft opacity + rise when motion is allowed.
 * Content is visible immediately on SSR (no opacity:0 first paint).
 */
'use client';

import { m } from 'framer-motion';
import type { ReactNode } from 'react';

import { useMotionTier } from './MotionProvider';
import { distance, duration, ease } from './tokens';

export default function RouteEntrance({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	const { tier } = useMotionTier();

	if (tier === 'reduced') {
		return <div className={className}>{children}</div>;
	}

	const rise = tier === 'lite' ? distance.ui * 0.5 : distance.ui;

	return (
		<m.div
			className={className}
			initial={{ opacity: 0.94, y: rise }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: duration.page, ease: ease.reveal }}
		>
			{children}
		</m.div>
	);
}
