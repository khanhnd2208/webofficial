'use client';

import { m, useReducedMotion } from 'framer-motion';

import { useMotionTier } from '@/components/motion/MotionProvider';
import { duration, ease } from '@/components/motion/tokens';

/**
 * Editorial line-art: KIẾN THỨC → HIỂU → THỬ → ĐƯA VÀO CÔNG VIỆC.
 * Paths draw when motion is allowed; reduced motion shows the full graphic.
 */
export function KnowledgeToWorkGraphic({ className = '' }: { className?: string }) {
	const { allowsReveal, reduced } = useMotionTier();
	const prefersReduced = useReducedMotion();
	const instant = !allowsReveal || reduced || prefersReduced;

	const pathTransition = instant
		? { duration: 0 }
		: { duration: duration.pathDraw, ease: ease.reveal };

	return (
		<svg
			className={className}
			viewBox="0 0 420 360"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden
			role="img"
		>
			<title>Kiến thức đi vào công việc</title>
			{/* Paper sheets */}
			<m.rect
				x="28"
				y="48"
				width="88"
				height="112"
				rx="2"
				stroke="currentColor"
				strokeWidth="1.25"
				className="text-ink/35"
				initial={instant ? false : { pathLength: 0, opacity: 0.3 }}
				whileInView={{ pathLength: 1, opacity: 1 }}
				viewport={{ once: true }}
				transition={pathTransition}
			/>
			<m.path
				d="M42 72h60M42 88h48M42 104h54M42 120h36"
				stroke="currentColor"
				strokeWidth="1"
				strokeLinecap="round"
				className="text-ink/25"
				initial={instant ? false : { pathLength: 0 }}
				whileInView={{ pathLength: 1 }}
				viewport={{ once: true }}
				transition={{ ...pathTransition, delay: instant ? 0 : 0.15 }}
			/>

			{/* Journey path */}
			<m.path
				d="M130 104 C 170 104, 190 70, 230 88 S 290 140, 330 128 S 370 90, 392 108"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				className="text-accent"
				initial={instant ? false : { pathLength: 0, opacity: 0.4 }}
				whileInView={{ pathLength: 1, opacity: 1 }}
				viewport={{ once: true }}
				transition={{ ...pathTransition, delay: instant ? 0 : 0.2 }}
			/>

			{/* Nodes */}
			{[
				{ cx: 130, cy: 84, label: 'Kiến thức', lx: 98, ly: 132 },
				{ cx: 230, cy: 88, label: 'Hiểu', lx: 214, ly: 68 },
				{ cx: 330, cy: 128, label: 'Thử', lx: 316, ly: 152 },
				{ cx: 392, cy: 88, label: 'Công việc', lx: 348, ly: 88 },
			].map((node, i) => (
				<g key={node.label}>
					<m.circle
						cx={node.cx}
						cy={node.cy}
						r="5"
						className="fill-canvas stroke-accent"
						strokeWidth="1.5"
						initial={instant ? false : { scale: 0, opacity: 1 }}
						whileInView={{ scale: 1, opacity: 1 }}
						viewport={{ once: true }}
						transition={{
							duration: instant ? 0 : duration.ui,
							delay: instant ? 0 : 0.35 + i * 0.12,
							ease: ease.reveal,
						}}
					/>
					<m.text
						x={node.lx}
						y={node.ly}
						className="fill-ink/70"
						style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace' }}
						initial={instant ? false : { opacity: 1, y: 6 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{
							duration: instant ? 0 : duration.section,
							delay: instant ? 0 : 0.45 + i * 0.12,
							ease: ease.reveal,
						}}
					>
						{node.label}
					</m.text>
				</g>
			))}

			{/* Workflow box at end */}
			<m.rect
				x="280"
				y="200"
				width="112"
				height="96"
				rx="2"
				stroke="currentColor"
				strokeWidth="1.25"
				className="text-ink/35"
				initial={instant ? false : { pathLength: 0, opacity: 0.3 }}
				whileInView={{ pathLength: 1, opacity: 1 }}
				viewport={{ once: true }}
				transition={{ ...pathTransition, delay: instant ? 0 : 0.5 }}
			/>
			<m.path
				d="M296 224h80M296 244h64M296 264h72"
				stroke="currentColor"
				strokeWidth="1"
				strokeLinecap="round"
				className="text-accent/60"
				initial={instant ? false : { pathLength: 0 }}
				whileInView={{ pathLength: 1 }}
				viewport={{ once: true }}
				transition={{ ...pathTransition, delay: instant ? 0 : 0.65 }}
			/>
			{/* Connecting dashed line from path to box */}
			<m.path
				d="M360 148 L340 200"
				stroke="currentColor"
				strokeWidth="1"
				strokeDasharray="3 4"
				className="text-ink/30"
				initial={instant ? false : { pathLength: 0 }}
				whileInView={{ pathLength: 1 }}
				viewport={{ once: true }}
				transition={{ ...pathTransition, delay: instant ? 0 : 0.55 }}
			/>
		</svg>
	);
}
