'use client';

import { m, type TargetAndTransition, type Transition } from 'framer-motion';

import type { PrizeTier } from '../domain/drawPool';
import styles from './fmt2026.module.css';
import { BOOTH } from './boothPalette';

/**
 * Placeholder teacher drawn in SVG, built from the same layers the final art
 * will use: body, a separate right arm that pivots at the shoulder, and a bag
 * split into back and front so the hand disappears inside it. Swap the shapes
 * for AI-drawn layers later without touching the booth logic.
 */

export type TeacherPhase = 'idle' | 'focus' | 'dim' | 'reach' | 'rummage' | 'pull';

export type TeacherLook = {
	skin: string;
	hair: string;
	outfit: string;
	accent: string;
	longHair: boolean;
};

type Props = {
	name: string;
	look: TeacherLook;
	phase: TeacherPhase;
	tier: PrizeTier | 'luck' | null;
	pickable: boolean;
	mirrored?: boolean;
	onPick?: () => void;
};

const ARM_ORIGIN = { originX: 0.5, originY: 0.056 };
const BAG_ORIGIN = { originX: 0.5, originY: 1 };

function armMotion(phase: TeacherPhase): { animate: TargetAndTransition; transition: Transition } {
	switch (phase) {
		case 'focus':
			return {
				animate: { rotate: [-120, -150, -120, -150, -135] },
				transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
			};
		case 'reach':
			return {
				animate: { rotate: [6, -60, -24] },
				transition: { duration: 0.7, times: [0, 0.45, 1], ease: 'easeInOut' },
			};
		case 'rummage':
			return {
				animate: { rotate: [-24, -18, -29, -20, -27, -22] },
				transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' },
			};
		case 'pull':
			return {
				animate: { rotate: [-24, -40, -155] },
				transition: { duration: 0.55, times: [0, 0.3, 1], ease: [0.2, 0.9, 0.3, 1.2] },
			};
		default:
			return {
				animate: { rotate: [6, 2, 6] },
				transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
			};
	}
}

function bagMotion(phase: TeacherPhase, tier: Props['tier']): TargetAndTransition {
	if (phase === 'rummage') {
		const kick = tier === 'epic' ? 9 : tier === 'rare' ? 6 : 4;
		return {
			rotate: [0, -kick, kick, -kick / 2, kick / 2, 0],
			scaleY: [1, 1.04, 0.97, 1.03, 1],
			transition: { duration: 0.5, repeat: Infinity },
		};
	}
	if (phase === 'pull')
		return { rotate: 0, scaleY: [0.92, 1.06, 1], transition: { duration: 0.4 } };
	return { rotate: 0, scaleY: 1 };
}

function bodyMotion(phase: TeacherPhase): TargetAndTransition {
	switch (phase) {
		case 'reach':
		case 'rummage':
			return { rotate: 4, transition: { duration: 0.4 } };
		case 'pull':
			return { rotate: -3, y: [-0, -10, 0], transition: { duration: 0.5 } };
		case 'focus':
			return { rotate: 0, y: [0, -6, 0], transition: { duration: 0.8, repeat: Infinity } };
		default:
			return {
				rotate: 0,
				scaleY: [1, 1.015, 1],
				transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
			};
	}
}

export function TeacherFigure({ name, look, phase, tier, pickable, mirrored, onPick }: Props) {
	const arm = armMotion(phase);
	const bag = bagMotion(phase, tier);
	const glow = tier === 'epic' ? BOOTH.goldBright : tier === 'rare' ? BOOTH.ice : BOOTH.cream;

	return (
		<m.button
			type="button"
			className={styles.teacher}
			data-pickable={pickable}
			aria-label={pickable ? `Nhận quà từ ${name}` : name}
			disabled={!pickable}
			onClick={onPick}
			animate={{
				opacity: phase === 'dim' ? 0.35 : 1,
				scale: phase === 'focus' ? 1.06 : phase === 'dim' ? 0.92 : 1,
				filter: phase === 'dim' ? 'grayscale(0.7)' : 'grayscale(0)',
			}}
			whileHover={pickable ? { scale: 1.08 } : undefined}
			transition={{ type: 'spring', stiffness: 220, damping: 20 }}
		>
			{(phase === 'focus' || phase === 'rummage' || phase === 'pull') && (
				<m.span
					className={styles.halo}
					initial={{ opacity: 0 }}
					animate={{ opacity: [0.4, 0.9, 0.4] }}
					transition={{ duration: 1.2, repeat: Infinity }}
				/>
			)}
			<svg
				viewBox="0 0 320 440"
				aria-hidden="true"
				style={mirrored ? { transform: 'scaleX(-1)' } : undefined}
			>
				{/* Bag, back layer */}
				<m.g style={BAG_ORIGIN} animate={bag}>
					<path d="M205 312 Q255 290 305 312 L298 430 L212 430 Z" fill={BOOTH.wine} />
					<ellipse cx="255" cy="312" rx="50" ry="12" fill={BOOTH.bagInside} />
				</m.g>

				{/* Body */}
				<m.g style={{ originX: 0.5, originY: 1 }} animate={bodyMotion(phase)}>
					<rect x="108" y="350" width="28" height="78" rx="10" fill={BOOTH.trousers} />
					<rect x="146" y="350" width="28" height="78" rx="10" fill={BOOTH.trousers} />
					<path d="M92 160 Q140 136 190 160 L206 362 Q140 376 76 362 Z" fill={look.outfit} />
					<path d="M128 150 L140 196 L152 150 Z" fill={BOOTH.white} />
					<text
						x="140"
						y="268"
						textAnchor="middle"
						fontSize="30"
						fontWeight="800"
						fill={look.accent}
						style={
							mirrored
								? { transform: 'scaleX(-1)', transformBox: 'fill-box', transformOrigin: 'center' }
								: undefined
						}
					>
						FMT
					</text>
					{/* Left arm, still */}
					<rect
						x="80"
						y="160"
						width="20"
						height="160"
						rx="10"
						fill={look.outfit}
						transform="rotate(8 90 160)"
					/>
					<circle cx="68" cy="318" r="13" fill={look.skin} />
					{/* Head */}
					{look.longHair && (
						<path d="M88 92 Q90 170 120 176 L160 176 Q190 170 192 92 Z" fill={look.hair} />
					)}
					<circle cx="140" cy="94" r="46" fill={look.skin} />
					<path
						d="M94 88 Q100 40 140 42 Q182 40 188 88 Q160 64 120 70 Q104 74 94 88 Z"
						fill={look.hair}
					/>
					<m.g
						animate={{ scaleY: [1, 1, 0.1, 1] }}
						transition={{ duration: 4, repeat: Infinity, times: [0, 0.92, 0.96, 1] }}
						style={{ originY: 0.5 }}
					>
						<circle cx="124" cy="96" r="5" fill={BOOTH.ink} />
						<circle cx="156" cy="96" r="5" fill={BOOTH.ink} />
					</m.g>
					<path
						d={
							phase === 'pull' || phase === 'focus'
								? 'M124 112 Q140 130 156 112 Z'
								: 'M126 114 Q140 124 154 114'
						}
						fill={phase === 'pull' || phase === 'focus' ? BOOTH.wine : 'none'}
						stroke={BOOTH.wine}
						strokeWidth="4"
						strokeLinecap="round"
					/>
					<circle cx="112" cy="110" r="7" fill={BOOTH.pink} opacity="0.5" />
					<circle cx="168" cy="110" r="7" fill={BOOTH.pink} opacity="0.5" />
				</m.g>

				{/* Right arm: pivots at the shoulder (188, 158) */}
				<m.g style={ARM_ORIGIN} animate={arm.animate} transition={arm.transition}>
					<circle cx="188" cy="158" r="12" fill={look.outfit} />
					<rect x="178" y="158" width="20" height="170" rx="10" fill={look.outfit} />
					<circle cx="188" cy="335" r="14" fill={look.skin} />
					<m.circle
						cx="188"
						cy="340"
						r="22"
						fill={glow}
						initial={false}
						animate={
							phase === 'pull'
								? { opacity: [0, 1, 1], scale: [0.3, 1.4, 1.1] }
								: { opacity: 0, scale: 0.3 }
						}
						transition={{ duration: 0.5 }}
						style={{ filter: `drop-shadow(0 0 18px ${glow})` }}
					/>
				</m.g>

				{/* Bag, front layer: hides the hand while it rummages */}
				<m.g style={BAG_ORIGIN} animate={bag}>
					<path d="M207 318 Q255 330 303 318 L298 430 L212 430 Z" fill={BOOTH.red} />
					<path d="M232 300 Q255 262 278 300" fill="none" stroke={BOOTH.gold} strokeWidth="6" />
					<text
						x="255"
						y="388"
						textAnchor="middle"
						fontSize="26"
						fontWeight="800"
						fill={BOOTH.gold}
						style={
							mirrored
								? { transform: 'scaleX(-1)', transformBox: 'fill-box', transformOrigin: 'center' }
								: undefined
						}
					>
						FMT
					</text>
				</m.g>

				{phase === 'rummage' &&
					[0, 1, 2, 3].map((i) => (
						<m.circle
							key={i}
							cx={235 + i * 14}
							cy="312"
							r="4"
							fill={glow}
							initial={{ opacity: 0, y: 0 }}
							animate={{ opacity: [0, 1, 0], y: [-4, -60 - i * 10] }}
							transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
						/>
					))}
			</svg>
			<span className={styles.teacherName}>{name}</span>
		</m.button>
	);
}
