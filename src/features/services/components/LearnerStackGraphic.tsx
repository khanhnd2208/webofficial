'use client';

import { m, useReducedMotion } from 'framer-motion';

import { useMotionTier } from '@/components/motion/MotionProvider';
import { duration, ease } from '@/components/motion/tokens';

const CARDS = [
	{ label: 'Tiếng Anh', x: 36, y: 36, rotate: -4 },
	{ label: 'AI & tự học', x: 72, y: 72, rotate: 1 },
	{ label: 'Phương pháp học', x: 108, y: 88, rotate: 3 },
] as const;

/**
 * Three stacked learner cards — English / AI & self-study / method.
 */
export function LearnerStackGraphic({ className = '' }: { className?: string }) {
	const { allowsReveal, reduced } = useMotionTier();
	const prefersReduced = useReducedMotion();
	const instant = !allowsReveal || reduced || prefersReduced;

	return (
		<svg
			className={className}
			viewBox="0 0 320 220"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden
		>
			{CARDS.map((card, i) => (
				<m.g
					key={card.label}
					initial={instant ? false : { opacity: 1, y: 16 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{
						duration: instant ? 0 : duration.section,
						delay: instant ? 0 : 0.1 + i * 0.12,
						ease: ease.reveal,
					}}
				>
					<rect
						x={card.x}
						y={card.y}
						width="160"
						height="72"
						rx="2"
						transform={`rotate(${card.rotate} ${card.x + 80} ${card.y + 36})`}
						className="fill-paper stroke-ink/30"
						strokeWidth="1.25"
					/>
					<text
						x={card.x + 80}
						y={card.y + 42}
						textAnchor="middle"
						transform={`rotate(${card.rotate} ${card.x + 80} ${card.y + 36})`}
						className="fill-ink"
						style={{
							fontSize: 13,
							fontFamily: 'var(--font-serif-display), Georgia, serif',
						}}
					>
						{card.label}
					</text>
				</m.g>
			))}
		</svg>
	);
}
