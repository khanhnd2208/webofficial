'use client';

import { m, useReducedMotion } from 'framer-motion';

import { useMotionTier } from '@/components/motion/MotionProvider';
import { duration, ease } from '@/components/motion/tokens';

type IconKind = 'compass' | 'people' | 'briefcase' | 'sync';

const ZONES = [
	{ id: 'direction', label: 'Định hướng', x: 132, y: 43, icon: 'compass' as IconKind },
	{ id: 'people', label: 'Con người', x: 252, y: 43, icon: 'people' as IconKind },
	{ id: 'work', label: 'Công việc', x: 132, y: 178, icon: 'briefcase' as IconKind },
	{ id: 'coord', label: 'Phối hợp', x: 252, y: 178, icon: 'sync' as IconKind },
] as const;

const ZONE_WIDTH = 96;
const ZONE_HEIGHT = 67;

/** Small line-icon set — same weight/round-cap as the site's hand-drawn illustrations. */
function ZoneIcon({ kind }: { kind: IconKind }) {
	switch (kind) {
		case 'compass':
			return (
				<g strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
					<circle cx="8" cy="8" r="6.25" className="stroke-ink/55" />
					<path d="M8 8 L11.2 4.6 L9.3 8.7 Z" className="fill-accent stroke-accent" />
					<circle cx="8" cy="8" r="0.9" className="fill-ink stroke-ink" />
				</g>
			);
		case 'people':
			return (
				<g strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="stroke-ink/55">
					<circle cx="5.3" cy="5.6" r="2.3" />
					<path d="M1.4 14 C1.4 10.9 3.3 9.4 5.3 9.4 C7.3 9.4 9.2 10.9 9.2 14" />
					<circle cx="11.1" cy="6.6" r="1.9" />
					<path d="M8.2 14.4 C8.2 11.9 9.8 10.7 11.1 10.7 C12.4 10.7 14 11.9 14 14.4" />
				</g>
			);
		case 'briefcase':
			return (
				<g strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="stroke-ink/55">
					<rect x="1.6" y="6" width="12.8" height="8.2" rx="1.2" />
					<path d="M5.8 6V4.6c0-.9.7-1.6 1.6-1.6h1.2c.9 0 1.6.7 1.6 1.6V6" />
					<line x1="1.6" y1="9.6" x2="14.4" y2="9.6" />
				</g>
			);
		case 'sync':
			return (
				<g strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="stroke-ink/55">
					<path d="M2.4 8.4a5.6 5.6 0 0 1 9.6-4" />
					<path d="M12 1.8v2.9H9.1" />
					<path d="M13.6 7.6a5.6 5.6 0 0 1-9.6 4" />
					<path d="M4 14.2v-2.9h2.9" />
				</g>
			);
	}
}

/**
 * Four-domain management system graphic — zones around a center hub.
 */
export function ManagementSystemGraphic({ className = '' }: { className?: string }) {
	const { allowsReveal, reduced } = useMotionTier();
	const prefersReduced = useReducedMotion();
	const instant = !allowsReveal || reduced || prefersReduced;

	return (
		<svg
			className={className}
			viewBox="0 0 384 288"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden
		>
			{/* Center hub */}
			<m.circle
				cx="192"
				cy="144"
				r="30"
				className="stroke-accent"
				style={{ fill: 'var(--accent-subtle)' }}
				strokeWidth="1.75"
				initial={instant ? false : { scale: 0.6, opacity: 1 }}
				whileInView={{ scale: 1, opacity: 1 }}
				viewport={{ once: true }}
				transition={{ duration: instant ? 0 : duration.section, ease: ease.reveal }}
			/>
			<text
				x="192"
				y="141"
				textAnchor="middle"
				className="fill-ink"
				style={{ fontSize: 13, fontFamily: 'var(--font-serif-display), Georgia, serif' }}
			>
				Tổ chức
			</text>
			<text
				x="192"
				y="155"
				textAnchor="middle"
				className="fill-ink-secondary"
				style={{ fontSize: 12, fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em' }}
			>
				HỆ THỐNG
			</text>

			{ZONES.map((zone, i) => {
				const cx = zone.x + ZONE_WIDTH / 2;
				const cy = zone.y + ZONE_HEIGHT / 2;
				return (
					<g key={zone.id}>
						<m.path
							d={`M192 144 L${cx} ${cy}`}
							strokeWidth="1.25"
							strokeDasharray="2 5"
							className="stroke-ink/35"
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
							width={ZONE_WIDTH}
							height={ZONE_HEIGHT}
							rx="3"
							className="stroke-ink/40"
							style={{ fill: 'var(--paper)' }}
							strokeWidth="1.5"
							initial={instant ? false : { opacity: 1 }}
							whileInView={{ opacity: 1 }}
							viewport={{ once: true }}
							transition={{
								duration: instant ? 0 : duration.section,
								delay: instant ? 0 : 0.25 + i * 0.08,
								ease: ease.reveal,
							}}
						/>
						<m.g
							transform={`translate(${zone.x + 12}, ${zone.y + 10})`}
							initial={instant ? false : { opacity: 1 }}
							whileInView={{ opacity: 1 }}
							viewport={{ once: true }}
							transition={{
								duration: instant ? 0 : duration.ui,
								delay: instant ? 0 : 0.32 + i * 0.08,
							}}
						>
							<ZoneIcon kind={zone.icon} />
						</m.g>
						<m.text
							x={zone.x + 12}
							y={zone.y + 50}
							className="fill-ink"
							style={{ fontSize: 13.5, fontFamily: 'var(--font-serif-display), Georgia, serif' }}
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
				);
			})}
		</svg>
	);
}
