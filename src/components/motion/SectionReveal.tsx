'use client';

import { m } from 'framer-motion';
import type { ReactNode } from 'react';

import { useMotionTier } from './MotionProvider';
import { distance, duration, ease } from './tokens';

type SectionRevealProps = {
	children: ReactNode;
	className?: string;
	delay?: number;
	as?: 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer';
};

/**
 * One-shot section entrance. Content stays visible if JS is slow —
 * only translateY supplements; opacity never starts at 0.
 */
export default function SectionReveal({
	children,
	className,
	delay = 0,
	as = 'div',
}: SectionRevealProps) {
	const { allowsReveal, reduced } = useMotionTier();
	const MotionTag = m[as];

	if (!allowsReveal) {
		const Static = as;
		return <Static className={className}>{children}</Static>;
	}

	return (
		<MotionTag
			className={className}
			initial={{ opacity: 1, y: reduced ? 0 : distance.section }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: '-10% 0px' }}
			transition={{
				duration: reduced ? duration.reducedCrossfade : duration.section,
				ease: ease.reveal,
				delay: reduced ? 0 : delay,
			}}
		>
			{children}
		</MotionTag>
	);
}
