'use client';

import { m, useReducedMotion } from 'framer-motion';

import { useMotionTier } from './MotionProvider';
import { duration, ease } from './tokens';

type JourneyLineProps = {
	className?: string;
	delay?: number;
	drawDuration?: number;
	/** Compact stroke for inline process; wide for hero/CTA */
	variant?: 'hero' | 'process' | 'cta';
};

const PATHS = {
	hero: 'M4 48 C 60 48, 80 12, 140 20 S 220 56, 280 40 S 340 8, 396 16',
	process: 'M4 20 C 80 20, 100 4, 180 12 S 280 28, 396 16',
	cta: 'M4 36 C 70 36, 90 10, 160 18 S 250 44, 320 28 S 360 12, 396 16',
} as const;

/**
 * Signature SVG path draw. Reduced motion: path appears fully drawn (no animation).
 */
export default function JourneyLine({
	className = '',
	delay = 0,
	drawDuration = duration.pathDraw,
	variant = 'hero',
}: JourneyLineProps) {
	const { tier } = useMotionTier();
	const reduce = useReducedMotion();
	const instant = reduce || tier === 'reduced';
	const d = PATHS[variant];

	return (
		<svg
			className={className}
			viewBox="0 0 400 60"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden
		>
			<m.path
				d={d}
				stroke="currentColor"
				strokeWidth={1.5}
				strokeLinecap="round"
				strokeLinejoin="round"
				initial={instant ? false : { pathLength: 0, opacity: 0.4 }}
				animate={{ pathLength: 1, opacity: 1 }}
				transition={
					instant ? { duration: 0 } : { duration: drawDuration, delay, ease: ease.reveal }
				}
			/>
		</svg>
	);
}
