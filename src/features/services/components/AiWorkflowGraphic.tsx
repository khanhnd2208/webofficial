'use client';

import { m, useReducedMotion } from 'framer-motion';

import { useMotionTier } from '@/components/motion/MotionProvider';
import { duration, ease } from '@/components/motion/tokens';

const STEPS = [
	{ label: 'Công việc', y: 32 },
	{ label: 'AI hỗ trợ', y: 92 },
	{ label: 'Con người kiểm tra', y: 152 },
	{ label: 'Quy trình lặp lại', y: 212 },
] as const;

const SPINE_X = 168;
const BOX_X = 192;
const BOX_WIDTH = 142;
const BOX_HEIGHT = 34;

function StepIcon({ index }: { index: number }) {
	// 0 briefcase, 1 spark (AI), 2 checkmark drawn on the checkpoint node itself, 3 loop
	if (index === 0) {
		return (
			<g strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="stroke-ink/55">
				<rect x="-6.4" y="-2" width="12.8" height="8.2" rx="1.1" />
				<path d="M-2.2 -2v-1.4c0-.9.7-1.6 1.6-1.6h1.2c.9 0 1.6.7 1.6 1.6V-2" />
			</g>
		);
	}
	if (index === 1) {
		return (
			<path
				d="M0 -7 L1.6 -1.6 L7 0 L1.6 1.6 L0 7 L-1.6 1.6 L-7 0 L-1.6 -1.6 Z"
				className="fill-accent"
			/>
		);
	}
	return (
		<g strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="stroke-ink/55">
			<path d="M-5.6 1.2a5.6 5.6 0 0 1 9.6-4" />
			<path d="M4 -6v2.9H1.1" />
			<path d="M5.6 -1.2a5.6 5.6 0 0 1-9.6 4" />
			<path d="M-4 6v-2.9h2.9" />
		</g>
	);
}

/**
 * AI workflow with a human checkpoint — vertical spine with a return loop
 * signalling the iterate step, matching the site's line-icon vocabulary.
 */
export function AiWorkflowGraphic({ className = '' }: { className?: string }) {
	const { allowsReveal, reduced } = useMotionTier();
	const prefersReduced = useReducedMotion();
	const instant = !allowsReveal || reduced || prefersReduced;

	const pathTransition = instant
		? { duration: 0 }
		: { duration: duration.pathDraw, ease: ease.reveal };

	return (
		<svg
			className={className}
			viewBox="0 0 356 260"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden
		>
			{/* Spine */}
			<m.path
				d={`M${SPINE_X} 44 V228`}
				stroke="currentColor"
				strokeWidth="2"
				className="text-accent"
				initial={instant ? false : { pathLength: 0 }}
				whileInView={{ pathLength: 1 }}
				viewport={{ once: true }}
				transition={pathTransition}
			/>
			{/* Return loop — visualises "lặp lại" feeding back into the top of the flow */}
			<m.path
				d={`M${SPINE_X - 12} 224 C 96 224, 96 48, ${SPINE_X - 12} 44`}
				stroke="currentColor"
				strokeWidth="1.25"
				strokeDasharray="2 5"
				strokeLinecap="round"
				className="text-ink/35"
				initial={instant ? false : { pathLength: 0 }}
				whileInView={{ pathLength: 1 }}
				viewport={{ once: true }}
				transition={{ ...pathTransition, delay: instant ? 0 : 0.6 }}
			/>
			<m.path
				d={`M${SPINE_X - 16} 49 L${SPINE_X - 12} 41 L${SPINE_X - 6} 48`}
				stroke="currentColor"
				strokeWidth="1.25"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="text-ink/35"
				initial={instant ? false : { opacity: 0 }}
				whileInView={{ opacity: 1 }}
				viewport={{ once: true }}
				transition={{ duration: instant ? 0 : duration.ui, delay: instant ? 0 : 0.9 }}
			/>

			{STEPS.map((step, i) => {
				const isCheckpoint = i === 2;
				const nodeCy = step.y + 14;
				return (
					<g key={step.label}>
						<m.circle
							cx={SPINE_X}
							cy={nodeCy}
							r={isCheckpoint ? 10 : 6.5}
							className={isCheckpoint ? 'fill-accent stroke-accent' : 'stroke-ink/45'}
							style={isCheckpoint ? undefined : { fill: 'var(--paper)' }}
							strokeWidth="1.6"
							initial={instant ? false : { scale: 0, opacity: 1 }}
							whileInView={{ scale: 1, opacity: 1 }}
							viewport={{ once: true }}
							transition={{
								duration: instant ? 0 : duration.ui,
								delay: instant ? 0 : 0.2 + i * 0.12,
								ease: ease.reveal,
							}}
						/>
						{isCheckpoint ? (
							<m.path
								d={`M${SPINE_X - 4} ${nodeCy} l3 3.2 l5.5 -6.4`}
								stroke="var(--accent-foreground)"
								strokeWidth="1.6"
								strokeLinecap="round"
								strokeLinejoin="round"
								initial={instant ? false : { pathLength: 0 }}
								whileInView={{ pathLength: 1 }}
								viewport={{ once: true }}
								transition={{
									duration: instant ? 0 : duration.ui,
									delay: instant ? 0 : 0.4 + i * 0.12,
								}}
							/>
						) : null}

						<m.rect
							x={BOX_X}
							y={step.y}
							width={BOX_WIDTH}
							height={BOX_HEIGHT}
							rx="3"
							className="stroke-ink/35"
							style={{ fill: 'var(--paper)' }}
							strokeWidth="1.25"
							initial={instant ? false : { opacity: 1 }}
							whileInView={{ opacity: 1 }}
							viewport={{ once: true }}
							transition={{
								duration: instant ? 0 : duration.section,
								delay: instant ? 0 : 0.25 + i * 0.12,
								ease: ease.reveal,
							}}
						/>
						<m.g
							transform={`translate(${BOX_X + 15}, ${nodeCy})`}
							initial={instant ? false : { opacity: 1 }}
							whileInView={{ opacity: 1 }}
							viewport={{ once: true }}
							transition={{
								duration: instant ? 0 : duration.ui,
								delay: instant ? 0 : 0.3 + i * 0.12,
							}}
						>
							<StepIcon index={i} />
						</m.g>
						<m.text
							x={BOX_X + 30}
							y={nodeCy + 4}
							className="fill-ink"
							style={{ fontSize: 12.5, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
							initial={instant ? false : { opacity: 1 }}
							whileInView={{ opacity: 1 }}
							viewport={{ once: true }}
							transition={{
								duration: instant ? 0 : duration.ui,
								delay: instant ? 0 : 0.32 + i * 0.12,
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
