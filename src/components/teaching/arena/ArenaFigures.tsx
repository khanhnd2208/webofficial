import { GRAPHIC_COLORS as C } from '@/config/graphicColors';

import type { AvatarLook } from './arenaGame';
import styles from './arena.module.css';

export type MonsterMood = 'idle' | 'roar' | 'hurt' | 'laugh' | 'defeated';

/**
 * The boss. Plain SVG so it can be swapped for real art later: keep the
 * `mood` contract and replace the drawing.
 */
export function ArenaMonster({ mood, size = 240 }: { mood: MonsterMood; size?: number }) {
	const defeated = mood === 'defeated';
	const body = defeated ? C['475569'] : C['7c3aed'];
	const belly = defeated ? C['e2e8f0'] : C['ddd6fe'];
	return (
		<div className={styles.monster} data-mood={mood} style={{ width: size }}>
			<svg viewBox="0 0 240 220" role="img" aria-label="Quái vật">
				<ellipse cx="120" cy="208" rx="82" ry="10" fill="rgb(0 0 0 / 35%)" />
				{/* horns */}
				<path d="M62 64 L46 14 L88 50 Z" fill={C['f59e0b']} stroke={C['111827']} strokeWidth="4" />
				<path
					d="M178 64 L194 14 L152 50 Z"
					fill={C['f59e0b']}
					stroke={C['111827']}
					strokeWidth="4"
				/>
				{/* arms */}
				<g className={styles.monsterArmLeft}>
					<ellipse
						cx="34"
						cy="128"
						rx="20"
						ry="34"
						fill={body}
						stroke={C['111827']}
						strokeWidth="4"
					/>
					<path
						d="M20 152 l-6 12 M30 158 l-2 13 M40 156 l3 12"
						stroke={C['111827']}
						strokeWidth="4"
					/>
				</g>
				<g className={styles.monsterArmRight}>
					<ellipse
						cx="206"
						cy="128"
						rx="20"
						ry="34"
						fill={body}
						stroke={C['111827']}
						strokeWidth="4"
					/>
					<path
						d="M220 152 l6 12 M210 158 l2 13 M200 156 l-3 12"
						stroke={C['111827']}
						strokeWidth="4"
					/>
				</g>
				{/* body */}
				<path
					d="M120 36 C176 36 206 80 206 128 C206 178 172 204 120 204 C68 204 34 178 34 128 C34 80 64 36 120 36 Z"
					fill={body}
					stroke={C['111827']}
					strokeWidth="5"
				/>
				<ellipse cx="120" cy="150" rx="54" ry="42" fill={belly} opacity="0.55" />
				{/* eyes */}
				{defeated ? (
					<g stroke={C['111827']} strokeWidth="6" strokeLinecap="round">
						<path d="M78 82 l24 24 M102 82 l-24 24" />
						<path d="M138 82 l24 24 M162 82 l-24 24" />
					</g>
				) : (
					<g>
						<circle cx="90" cy="94" r="20" fill={C['fff']} stroke={C['111827']} strokeWidth="4" />
						<circle cx="150" cy="94" r="20" fill={C['fff']} stroke={C['111827']} strokeWidth="4" />
						<circle className={styles.monsterPupil} cx="92" cy="97" r="8" fill={C['111827']} />
						<circle className={styles.monsterPupil} cx="148" cy="97" r="8" fill={C['111827']} />
						{mood === 'roar' || mood === 'hurt' ? (
							<g stroke={C['111827']} strokeWidth="5" strokeLinecap="round">
								<path d="M68 66 l40 12" />
								<path d="M172 66 l-40 12" />
							</g>
						) : null}
					</g>
				)}
				{/* mouth */}
				<MonsterMouth mood={mood} />
			</svg>
		</div>
	);
}

function MonsterMouth({ mood }: { mood: MonsterMood }) {
	if (mood === 'roar') {
		return (
			<g>
				<ellipse
					cx="120"
					cy="150"
					rx="34"
					ry="26"
					fill={C['1a0e04']}
					stroke={C['111827']}
					strokeWidth="4"
				/>
				<path d="M94 134 l8 14 l8 -14 l10 14 l10 -14 l8 14 l8 -14" fill={C['fff']} />
				<ellipse cx="120" cy="164" rx="14" ry="7" fill={C['db2777']} />
			</g>
		);
	}
	if (mood === 'laugh') {
		return (
			<g>
				<path
					d="M82 136 Q120 184 158 136 Z"
					fill={C['1a0e04']}
					stroke={C['111827']}
					strokeWidth="4"
					strokeLinejoin="round"
				/>
				<path d="M92 138 l6 10 l6 -10 M136 138 l6 10 l6 -10" fill={C['fff']} />
			</g>
		);
	}
	if (mood === 'hurt') {
		return (
			<path
				d="M88 150 q8 -10 16 0 t16 0 t16 0 t16 0"
				fill="none"
				stroke={C['111827']}
				strokeWidth="5"
				strokeLinecap="round"
			/>
		);
	}
	if (mood === 'defeated') {
		return (
			<path
				d="M92 160 Q120 140 148 160"
				fill="none"
				stroke={C['111827']}
				strokeWidth="5"
				strokeLinecap="round"
			/>
		);
	}
	return (
		<g>
			<path
				d="M90 144 Q120 166 150 144"
				fill="none"
				stroke={C['111827']}
				strokeWidth="5"
				strokeLinecap="round"
			/>
			<path
				d="M100 148 l5 9 l5 -7 M130 148 l5 7 l5 -9"
				fill={C['fff']}
				stroke={C['111827']}
				strokeWidth="2"
			/>
		</g>
	);
}

/** A student figure. Purely decorative: the name label is rendered next to it in HTML. */
export function ArenaAvatar({ look, size = 56 }: { look: AvatarLook; size?: number }) {
	return (
		<svg viewBox="0 0 60 80" width={size} height={(size * 80) / 60} aria-hidden="true">
			<ellipse cx="30" cy="77" rx="16" ry="3" fill="rgb(0 0 0 / 30%)" />
			{/* legs */}
			<rect x="20" y="58" width="8" height="18" rx="4" fill={C['475569']} />
			<rect x="32" y="58" width="8" height="18" rx="4" fill={C['475569']} />
			{/* body */}
			<rect
				x="13"
				y="34"
				width="34"
				height="30"
				rx="12"
				fill={look.shirt}
				stroke={C['111827']}
				strokeWidth="2"
			/>
			{/* head */}
			{look.style === 1 ? (
				<path d="M13 22 Q13 4 30 4 Q47 4 47 22 L47 38 L13 38 Z" fill={look.hair} />
			) : null}
			<circle cx="30" cy="21" r="14" fill={look.skin} stroke={C['111827']} strokeWidth="2" />
			{look.style === 0 ? (
				<path d="M16 18 Q18 5 30 6 Q43 5 44 18 Q36 11 16 18 Z" fill={look.hair} />
			) : null}
			{look.style === 1 ? (
				<path d="M17 17 Q22 7 30 8 Q39 7 43 17 Q31 12 17 17 Z" fill={look.hair} />
			) : null}
			{look.style === 2 ? (
				<g>
					<path
						d="M15 16 Q16 4 30 4 Q44 4 45 16 Z"
						fill={look.shirt}
						stroke={C['111827']}
						strokeWidth="2"
					/>
					<rect
						x="28"
						y="14"
						width="22"
						height="4"
						rx="2"
						fill={look.shirt}
						stroke={C['111827']}
						strokeWidth="1.5"
					/>
				</g>
			) : null}
			<circle cx="25" cy="22" r="2" fill={C['111827']} />
			<circle cx="35" cy="22" r="2" fill={C['111827']} />
			<path
				d="M25 28 Q30 31 35 28"
				fill="none"
				stroke={C['111827']}
				strokeWidth="1.8"
				strokeLinecap="round"
			/>
		</svg>
	);
}
