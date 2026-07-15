'use client';

import { m, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

import { useMotionTier } from './MotionProvider';
import { distance, duration, ease } from './tokens';

type HorizonRevealProps = {
	children: ReactNode;
	className?: string;
	delay?: number;
	as?: 'div' | 'section' | 'li' | 'article' | 'p' | 'h2' | 'h3';
	once?: boolean;
};

/**
 * Mask-from-bottom reveal with slight upward travel.
 * Reduced / lite: short opacity fade only — no path/parallax feel.
 */
export default function HorizonReveal({
	children,
	className = '',
	delay = 0,
	as = 'div',
	once = true,
}: HorizonRevealProps) {
	const { tier } = useMotionTier();
	const reduce = useReducedMotion();
	const Mot = m[as];

	if (reduce || tier === 'reduced') {
		return (
			<Mot
				className={className}
				initial={{ opacity: 0 }}
				whileInView={{ opacity: 1 }}
				viewport={{ once, amount: 0.2 }}
				transition={{ duration: duration.reducedCrossfade, delay: delay * 0.3 }}
			>
				{children}
			</Mot>
		);
	}

	const y = tier === 'lite' ? distance.horizon * 0.7 : distance.horizon;

	return (
		<Mot
			className={className}
			style={{ overflow: 'hidden' }}
			initial={{ opacity: 0, y }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once, amount: 0.25 }}
			transition={{
				duration: tier === 'lite' ? duration.horizon * 0.75 : duration.horizon,
				delay,
				ease: ease.reveal,
			}}
		>
			{children}
		</Mot>
	);
}
