'use client';

import { m } from 'framer-motion';
import type { ReactNode } from 'react';

import { useMotionTier } from './MotionProvider';
import { duration, ease } from './tokens';

type EditorialImageProps = {
	children: ReactNode;
	className?: string;
	delay?: number;
};

/** @deprecated Prefer EditorialMedia — kept for gradual migration */
export default function EditorialImage({ children, className, delay = 0 }: EditorialImageProps) {
	const { allowsReveal, reduced } = useMotionTier();

	if (!allowsReveal) {
		return <div className={className}>{children}</div>;
	}

	return (
		<m.div
			className={`overflow-hidden ${className ?? ''}`}
			initial={reduced ? false : { opacity: 0.88, scale: 1.04 }}
			whileInView={{ opacity: 1, scale: 1 }}
			viewport={{ once: true, margin: '-8% 0px' }}
			transition={{
				duration: reduced ? duration.reducedCrossfade : duration.image,
				ease: ease.reveal,
				delay: reduced ? 0 : delay,
			}}
		>
			{children}
		</m.div>
	);
}
