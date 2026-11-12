import { useId, type CSSProperties } from 'react';

import { GRAPHIC_COLORS as C } from '@/config/graphicColors';

import { VectorBoss } from './ArenaBossArt';
import { MonsterEyes, MonsterMouth } from './ArenaMonsterFace';
import { arenaBossArt, bossFramePosition, type ArenaBoss, type MonsterMood } from './arenaBosses';
import styles from './arena.module.css';
import art from './arenaBoss.module.css';

export type { MonsterMood };

const INK = C['111827'];

/**
 * The boss, as `arenaBosses.ts` describes it: illustrated art shows the
 * frame for the current mood; the built-in drawing is recoloured per boss and
 * `look` moves its pupils toward a student. Either way the wrapper carries
 * `data-mood`, so shakes, squashes and the fall work for every boss.
 */
export function ArenaMonster({
	mood,
	size = 240,
	boss,
	enraged = false,
	look,
	decorative = false,
}: {
	mood: MonsterMood;
	size?: number;
	boss: ArenaBoss;
	enraged?: boolean;
	look?: { x: number; y: number };
	/** True where the boss is already named next to the picture. */
	decorative?: boolean;
}) {
	const id = useId();
	const defeated = mood === 'defeated';
	const angry = enraged || mood === 'roar' || mood === 'inhale' || mood === 'chomp';
	return (
		<div
			className={`${styles.monster} ${art.frame}`}
			data-design={boss.art.kind === 'vector' ? boss.art.design : undefined}
			data-mood={mood}
			data-enraged={(enraged && !defeated) || undefined}
			style={{ width: size }}
			aria-hidden={decorative || undefined}
		>
			{boss.art.kind === 'sheet' ? (
				<span
					className={styles.monsterSheet}
					role="img"
					aria-label={boss.name}
					style={
						{
							backgroundImage: `url('${arenaBossArt(boss.art.file)}')`,
							'--boss-frame': bossFramePosition(mood),
						} as CSSProperties
					}
				/>
			) : boss.art.kind === 'vector' ? (
				<VectorBoss
					id={id}
					design={boss.art.design}
					mood={mood}
					name={boss.name}
					enraged={enraged}
					angry={angry}
					look={look}
				/>
			) : (
				<BuiltinMonster
					id={id}
					mood={mood}
					hue={boss.art.hue}
					name={boss.name}
					enraged={enraged}
					angry={angry}
					look={look}
				/>
			)}
		</div>
	);
}

function BuiltinMonster({
	id,
	mood,
	hue,
	name,
	enraged,
	angry,
	look,
}: {
	id: string;
	mood: MonsterMood;
	hue: number;
	name: string;
	enraged: boolean;
	angry: boolean;
	look?: { x: number; y: number };
}) {
	const defeated = mood === 'defeated';
	const bodyFill = `url(#${id}-body)`;
	const hornFill = `url(#${id}-horn)`;
	return (
		<svg
			viewBox="0 0 240 220"
			role="img"
			aria-label={name}
			style={{ filter: `hue-rotate(${hue}deg)` }}
		>
			<defs>
				<radialGradient id={`${id}-body`} cx="36%" cy="26%" r="85%">
					<stop offset="0" stopColor={defeated ? C.e2e8f0 : C.a78bfa} />
					<stop offset="0.5" stopColor={defeated ? C['475569'] : C['7c3aed']} />
					<stop offset="1" stopColor={defeated ? C['111827'] : C['4c1d95']} />
				</radialGradient>
				<linearGradient id={`${id}-horn`} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor={C.fef3c7} />
					<stop offset="0.5" stopColor={C.f59e0b} />
					<stop offset="1" stopColor={C.ea580c} />
				</linearGradient>
			</defs>
			<ellipse className={styles.monsterShadow} cx="120" cy="209" rx="84" ry="9" />
			{/* back spikes */}
			<path
				d="M96 40 L104 16 L114 36 L120 8 L126 36 L136 16 L144 40 Z"
				fill={hornFill}
				stroke={INK}
				strokeWidth="4"
				strokeLinejoin="round"
			/>
			{/* horns */}
			<path
				d="M64 68 Q34 52 40 10 Q62 26 90 48 Z"
				fill={hornFill}
				stroke={INK}
				strokeWidth="4"
				strokeLinejoin="round"
			/>
			<path
				d="M176 68 Q206 52 200 10 Q178 26 150 48 Z"
				fill={hornFill}
				stroke={INK}
				strokeWidth="4"
				strokeLinejoin="round"
			/>
			{/* arms */}
			<g className={styles.monsterArmLeft}>
				<ellipse cx="32" cy="128" rx="21" ry="35" fill={bodyFill} stroke={INK} strokeWidth="4" />
				<path
					d="M14 154 l-5 15 l11 -9 l1 16 l9 -13 l6 13 l3 -18 Z"
					fill={C.fff}
					stroke={INK}
					strokeWidth="3"
					strokeLinejoin="round"
				/>
			</g>
			<g className={styles.monsterArmRight}>
				<ellipse cx="208" cy="128" rx="21" ry="35" fill={bodyFill} stroke={INK} strokeWidth="4" />
				<path
					d="M226 154 l5 15 l-11 -9 l-1 16 l-9 -13 l-6 13 l-3 -18 Z"
					fill={C.fff}
					stroke={INK}
					strokeWidth="3"
					strokeLinejoin="round"
				/>
			</g>
			{/* feet */}
			<ellipse cx="86" cy="202" rx="24" ry="10" fill={bodyFill} stroke={INK} strokeWidth="4" />
			<ellipse cx="154" cy="202" rx="24" ry="10" fill={bodyFill} stroke={INK} strokeWidth="4" />
			{/* body */}
			<g className={styles.monsterBody}>
				<path
					d="M120 34 C178 34 208 80 208 128 C208 180 172 204 120 204 C68 204 32 180 32 128 C32 80 62 34 120 34 Z"
					fill={bodyFill}
					stroke={INK}
					strokeWidth="5"
				/>
				<ellipse cx="120" cy="156" rx="56" ry="40" fill={C.ddd6fe} opacity="0.5" />
				<path
					d="M76 150 Q120 162 164 150 M84 170 Q120 182 156 170"
					fill="none"
					stroke={C['7c3aed']}
					strokeWidth="3"
					strokeLinecap="round"
					opacity="0.35"
				/>
				<ellipse
					cx="82"
					cy="58"
					rx="20"
					ry="9"
					fill={C.fff}
					opacity="0.22"
					transform="rotate(-28 82 58)"
				/>
				<circle cx="182" cy="104" r="6" fill={C['4c1d95']} opacity="0.45" />
				<circle cx="190" cy="124" r="4" fill={C['4c1d95']} opacity="0.45" />
				<circle cx="54" cy="112" r="5" fill={C['4c1d95']} opacity="0.45" />
				<MonsterEyes mood={mood} angry={angry} enraged={enraged} look={look} />
				<MonsterMouth mood={mood} />
				{mood === 'hurt' ? (
					<g className={styles.monsterSlash} stroke={C.fff} strokeLinecap="round" fill="none">
						<path d="M58 60 L186 176" strokeWidth="10" />
						<path d="M84 50 L198 150" strokeWidth="5" />
						<path d="M46 86 L160 190" strokeWidth="5" />
					</g>
				) : null}
			</g>
			{enraged && !defeated ? (
				<g className={styles.monsterSteam} fill={C.fff} opacity="0.8">
					<circle cx="36" cy="40" r="7" />
					<circle cx="26" cy="26" r="5" />
					<circle cx="204" cy="40" r="7" />
					<circle cx="214" cy="26" r="5" />
				</g>
			) : null}
			{defeated ? (
				<g className={styles.monsterDizzy} fill={C.ffd700} stroke={INK} strokeWidth="2">
					<path d="M70 22 l4 9 l10 1 l-8 6 l3 10 l-9 -6 l-9 6 l3 -10 l-8 -6 l10 -1 Z" />
					<path d="M170 22 l4 9 l10 1 l-8 6 l3 10 l-9 -6 l-9 6 l3 -10 l-8 -6 l10 -1 Z" />
				</g>
			) : null}
		</svg>
	);
}
