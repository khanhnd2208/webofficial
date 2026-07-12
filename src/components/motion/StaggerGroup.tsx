'use client';

import { m } from 'framer-motion';
import type { ReactNode } from 'react';

import { useMotionTier } from './MotionProvider';
import { distance, duration, ease, stagger } from './tokens';

type StaggerGroupProps = {
	children: ReactNode;
	className?: string;
	staggerMs?: number;
};

export function StaggerGroup({ children, className, staggerMs }: StaggerGroupProps) {
	const { allowsReveal, reduced } = useMotionTier();

	if (!allowsReveal || reduced) {
		return <div className={className}>{children}</div>;
	}

	return (
		<m.div
			className={className}
			initial="hidden"
			whileInView="visible"
			viewport={{ once: true, margin: '-8% 0px' }}
			variants={{
				hidden: {},
				visible: {
					transition: { staggerChildren: staggerMs ?? stagger.default },
				},
			}}
		>
			{children}
		</m.div>
	);
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
	const { allowsReveal, reduced } = useMotionTier();

	if (!allowsReveal || reduced) {
		return <div className={className}>{children}</div>;
	}

	return (
		<m.div
			className={className}
			variants={{
				hidden: { opacity: 0, y: distance.ui },
				visible: {
					opacity: 1,
					y: 0,
					transition: { duration: duration.section, ease: ease.reveal },
				},
			}}
		>
			{children}
		</m.div>
	);
}
