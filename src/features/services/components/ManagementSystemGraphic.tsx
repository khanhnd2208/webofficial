'use client';

import { m, useReducedMotion } from 'framer-motion';

import { useMotionTier } from '@/components/motion/MotionProvider';
import { duration, ease } from '@/components/motion/tokens';

const ZONES = [
	{ id: 'direction', label: 'Định hướng', x: 110, y: 36 },
	{ id: 'people', label: 'Con người', x: 210, y: 36 },
	{ id: 'work', label: 'Công việc', x: 110, y: 148 },
	{ id: 'coord', label: 'Phối hợp', x: 210, y: 148 },
] as const;

/**
 * Four-domain management system graphic — zones around a center.
 */
export function ManagementSystemGraphic({ className = '' }: { className?: string }) {
	const { allowsReveal, reduced } = useMotionTier();
	const prefersReduced = useReducedMotion();
	const instant = !allowsReveal || reduced || prefersReduced;

	return (
		<svg
			className={className}
			viewBox="0 0 320 240"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden
		>
			{/* Center hub */}
			<m.circle
				cx="160"
				cy="120"
				r="22"
				className="fill-paper stroke-accent"
				strokeWidth="1.5"
				initial={instant ? false : { scale: 0.6, opacity: 1 }}
				whileInView={{ scale: 1, opacity: 1 }}
				viewport={{ once: true }}
				transition={{ duration: instant ? 0 : duration.section, ease: ease.reveal }}
			/>
			<text
				x="160"
				y="124"
				textAnchor="middle"
				className="fill-ink"
				style={{ fontSize: 10, fontFamily: 'ui-monospace, monospace' }}
			>
				Tổ chức
			</text>

			{ZONES.map((zone, i) => (
				<g key={zone.id}>
					<m.line
						x1="160"
						y1="120"
						x2={zone.x + 40}
						y2={zone.y + 28}
						stroke="currentColor"
						strokeWidth="1"
						className="text-hairline"
						initial={instant ? false : { pathLength: 0 }}
						whileInView={{ pathLength: 1 }}
						viewport={{ once: true }}
						transition={{
							duration: instant ? 0 : duration.pathDraw * 0.6,
							delay: instant ? 0 : 0.15 + i * 0.08,
							ease: ease.reveal,
						}}
					/>
					<m.rect
						x={zone.x}
						y={zone.y}
						width="80"
						height="56"
						rx="2"
						className="fill-canvas stroke-ink/30"
						strokeWidth="1.25"
						initial={instant ? false : { opacity: 1 }}
						whileInView={{ opacity: 1 }}
						viewport={{ once: true }}
						transition={{
							duration: instant ? 0 : duration.section,
							delay: instant ? 0 : 0.25 + i * 0.08,
							ease: ease.reveal,
						}}
					/>
					<m.text
						x={zone.x + 40}
						y={zone.y + 32}
						textAnchor="middle"
						className="fill-ink"
						style={{ fontSize: 11, fontFamily: 'var(--font-serif-display), Georgia, serif' }}
						initial={instant ? false : { opacity: 1 }}
						whileInView={{ opacity: 1 }}
						viewport={{ once: true }}
						transition={{
							duration: instant ? 0 : duration.ui,
							delay: instant ? 0 : 0.35 + i * 0.08,
						}}
					>
						{zone.label}
					</m.text>
				</g>
			))}
		</svg>
	);
}
