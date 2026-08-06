'use client';

import { m, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

import { useMotionTier } from './MotionProvider';
import { duration, ease } from './tokens';

type TextRevealProps = {
	children: ReactNode;
	className?: string;
	delay?: number;
	as?: 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'p';
};

/**
 * Mask-clip text reveal — translateY inside overflow-hidden.
 * Animates on mount so above-the-fold headings never stay clipped.
 * SSR / reduced motion: content is fully visible immediately.
 */
export default function TextReveal({
	children,
	className,
	delay = 0,
	as = 'span',
}: TextRevealProps) {
	const { allowsReveal, reduced } = useMotionTier();
	const prefersReduced = useReducedMotion();
	const instant = !allowsReveal || reduced || prefersReduced;

	if (instant) {
		const Tag = as;
		return <Tag className={className}>{children}</Tag>;
	}

	const MotionTag = m[as];

	return (
		<span className="inline-block overflow-hidden align-bottom">
			<MotionTag
				className={`inline-block ${className ?? ''}`}
				initial={{ y: '110%' }}
				animate={{ y: 0 }}
				transition={{
					duration: duration.textMask,
					ease: ease.reveal,
					delay,
				}}
			>
				{children}
			</MotionTag>
		</span>
	);
}
