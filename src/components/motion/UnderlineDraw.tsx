'use client';

import { m, useReducedMotion } from 'framer-motion';

import { useMotionTier } from './MotionProvider';
import { duration, ease } from './tokens';

type UnderlineDrawProps = {
	className?: string;
	delay?: number;
	/** Accent bronze (default) or ink hairline */
	tone?: 'accent' | 'ink' | 'sunlight';
};

/**
 * Horizontal line that draws left→right when entering the viewport.
 * Reduced motion: appears fully drawn.
 */
export default function UnderlineDraw({
	className = '',
	delay = 0,
	tone = 'accent',
}: UnderlineDrawProps) {
	const { allowsReveal, reduced } = useMotionTier();
	const prefersReduced = useReducedMotion();
	const instant = !allowsReveal || reduced || prefersReduced;

	const toneClass =
		tone === 'ink' ? 'bg-ink/25' : tone === 'sunlight' ? 'bg-sunlight' : 'bg-accent';

	return (
		<m.span
			aria-hidden
			className={`block h-px origin-left ${toneClass} ${className}`}
			initial={instant ? false : { scaleX: 0 }}
			whileInView={{ scaleX: 1 }}
			viewport={{ once: true, margin: '-5% 0px' }}
			transition={
				instant ? { duration: 0 } : { duration: duration.underline, ease: ease.reveal, delay }
			}
		/>
	);
}
