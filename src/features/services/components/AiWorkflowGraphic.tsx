'use client';

import { m, useReducedMotion } from 'framer-motion';

import { useMotionTier } from '@/components/motion/MotionProvider';
import { duration, ease } from '@/components/motion/tokens';

const STEPS = [
	{ label: 'Công việc', y: 28 },
	{ label: 'AI hỗ trợ', y: 78 },
	{ label: 'Con người kiểm tra', y: 128 },
	{ label: 'Quy trình lặp lại', y: 178 },
] as const;

/**
 * AI workflow with human checkpoint — vertical flow.
 */
export function AiWorkflowGraphic({ className = '' }: { className?: string }) {
	const { allowsReveal, reduced } = useMotionTier();
	const prefersReduced = useReducedMotion();
	const instant = !allowsReveal || reduced || prefersReduced;

	return (
		<svg
			className={className}
			viewBox="0 0 280 230"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden
		>
			{/* Spine */}
			<m.path
				d="M140 40 V200"
				stroke="currentColor"
				strokeWidth="1.5"
				className="text-accent"
				initial={instant ? false : { pathLength: 0 }}
				whileInView={{ pathLength: 1 }}
				viewport={{ once: true }}
				transition={{ duration: instant ? 0 : duration.pathDraw, ease: ease.reveal }}
			/>

			{STEPS.map((step, i) => {
				const isCheckpoint = i === 2;
				return (
					<g key={step.label}>
						<m.circle
							cx="140"
							cy={step.y + 12}
							r={isCheckpoint ? 7 : 5}
							className={isCheckpoint ? 'fill-accent stroke-accent' : 'fill-canvas stroke-ink/40'}
							strokeWidth="1.5"
							initial={instant ? false : { scale: 0, opacity: 1 }}
							whileInView={{ scale: 1, opacity: 1 }}
							viewport={{ once: true }}
							transition={{
								duration: instant ? 0 : duration.ui,
								delay: instant ? 0 : 0.2 + i * 0.12,
								ease: ease.reveal,
							}}
						/>
						<m.rect
							x="168"
							y={step.y}
							width="96"
							height="28"
							rx="2"
							className="fill-canvas stroke-ink/25"
							strokeWidth="1"
							initial={instant ? false : { opacity: 1 }}
							whileInView={{ opacity: 1 }}
							viewport={{ once: true }}
							transition={{
								duration: instant ? 0 : duration.section,
								delay: instant ? 0 : 0.25 + i * 0.12,
								ease: ease.reveal,
							}}
						/>
						<m.text
							x="176"
							y={step.y + 18}
							className="fill-ink"
							style={{ fontSize: 10, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
							initial={instant ? false : { opacity: 1 }}
							whileInView={{ opacity: 1 }}
							viewport={{ once: true }}
							transition={{
								duration: instant ? 0 : duration.ui,
								delay: instant ? 0 : 0.3 + i * 0.12,
							}}
						>
							{step.label}
						</m.text>
					</g>
				);
			})}
		</svg>
	);
}
