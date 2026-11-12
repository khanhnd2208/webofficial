import { GRAPHIC_COLORS as C } from '@/config/graphicColors';

import type { MonsterMood } from './arenaBosses';
import styles from './arena.module.css';

const INK = C['111827'];

/** The eyes and mouth every drawn boss shares, one look per mood. */
export function MonsterEyes({
	mood,
	angry,
	enraged,
	look,
}: {
	mood: MonsterMood;
	angry: boolean;
	enraged: boolean;
	look?: { x: number; y: number };
}) {
	if (mood === 'defeated') {
		return (
			<g stroke={INK} strokeWidth="7" strokeLinecap="round">
				<path d="M76 80 l26 26 M102 80 l-26 26" />
				<path d="M138 80 l26 26 M164 80 l-26 26" />
			</g>
		);
	}
	if (mood === 'hurt') {
		return (
			<g stroke={INK} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none">
				<path d="M74 80 L102 94 L74 108" />
				<path d="M166 80 L138 94 L166 108" />
			</g>
		);
	}
	if (mood === 'laugh') {
		return (
			<g stroke={INK} strokeWidth="7" strokeLinecap="round" fill="none">
				<path d="M72 100 Q88 76 104 100" />
				<path d="M136 100 Q152 76 168 100" />
			</g>
		);
	}
	const pupil = mood === 'roar' || mood === 'inhale' ? 6 : 9;
	const iris = enraged ? C.dc2626 : C.f59e0b;
	const shift = { transform: `translate(${look?.x ?? 0}px, ${look?.y ?? 0}px)` };
	return (
		<g>
			<g className={styles.monsterEye}>
				<ellipse cx="88" cy="94" rx="22" ry="23" fill={C.fff} stroke={INK} strokeWidth="4" />
				<ellipse cx="152" cy="94" rx="22" ry="23" fill={C.fff} stroke={INK} strokeWidth="4" />
				<g className={styles.monsterPupil} style={shift}>
					<circle cx="90" cy="96" r={pupil + 5} fill={iris} />
					<circle cx="150" cy="96" r={pupil + 5} fill={iris} />
					<circle cx="90" cy="96" r={pupil} fill={INK} />
					<circle cx="150" cy="96" r={pupil} fill={INK} />
					<circle cx="86" cy="91" r="3.5" fill={C.fff} />
					<circle cx="146" cy="91" r="3.5" fill={C.fff} />
				</g>
			</g>
			<g
				className={styles.monsterBrow}
				data-angry={angry || undefined}
				stroke={INK}
				strokeWidth="7"
				strokeLinecap="round"
			>
				<path d={angry ? 'M62 60 L108 78' : 'M66 64 L106 66'} />
				<path d={angry ? 'M178 60 L132 78' : 'M174 64 L134 66'} />
			</g>
		</g>
	);
}

export function MonsterMouth({ mood }: { mood: MonsterMood }) {
	if (mood === 'roar' || mood === 'inhale') {
		return (
			<g className={styles.monsterMaw}>
				<ellipse
					cx="120"
					cy="154"
					rx="40"
					ry="32"
					fill={C['1a0e04']}
					stroke={INK}
					strokeWidth="5"
				/>
				<ellipse cx="120" cy="172" rx="20" ry="10" fill={C.db2777} />
				<path
					d="M86 138 l8 16 l8 -18 l9 18 l9 -19 l9 19 l9 -18 l8 18 l8 -16 Q120 116 86 138 Z"
					fill={C.fff}
					stroke={INK}
					strokeWidth="2"
					strokeLinejoin="round"
				/>
				<path
					d="M94 176 l7 -11 l8 13 l11 -14 l11 14 l8 -13 l7 11 Q120 190 94 176 Z"
					fill={C.fff}
					stroke={INK}
					strokeWidth="2"
					strokeLinejoin="round"
				/>
			</g>
		);
	}
	if (mood === 'chomp') {
		return (
			<g>
				<path
					d="M78 140 Q120 132 162 140 Q160 170 120 172 Q80 170 78 140 Z"
					fill={C.fff}
					stroke={INK}
					strokeWidth="5"
					strokeLinejoin="round"
				/>
				<path
					d="M80 154 L160 154 M94 138 v32 M107 136 v35 M120 136 v36 M133 136 v35 M146 138 v32"
					stroke={INK}
					strokeWidth="3"
				/>
			</g>
		);
	}
	if (mood === 'laugh') {
		return (
			<g>
				<path
					d="M78 134 Q120 196 162 134 Z"
					fill={C['1a0e04']}
					stroke={INK}
					strokeWidth="5"
					strokeLinejoin="round"
				/>
				<path d="M90 137 l7 12 l7 -12 Z M136 137 l7 12 l7 -12 Z" fill={C.fff} />
				<ellipse cx="120" cy="166" rx="16" ry="8" fill={C.db2777} />
			</g>
		);
	}
	if (mood === 'hurt') {
		return (
			<path
				d="M84 152 q9 -12 18 0 t18 0 t18 0 t18 0"
				fill="none"
				stroke={INK}
				strokeWidth="6"
				strokeLinecap="round"
			/>
		);
	}
	if (mood === 'defeated') {
		return (
			<g>
				<path
					d="M90 162 Q120 140 150 162"
					fill="none"
					stroke={INK}
					strokeWidth="6"
					strokeLinecap="round"
				/>
				<path
					d="M124 152 q14 4 10 20 q-12 4 -16 -10 Z"
					fill={C.db2777}
					stroke={INK}
					strokeWidth="3"
				/>
			</g>
		);
	}
	return (
		<g>
			<path
				d="M84 142 Q120 172 156 142"
				fill="none"
				stroke={INK}
				strokeWidth="6"
				strokeLinecap="round"
			/>
			<path
				d="M96 150 l6 12 l6 -9 Z M132 153 l6 9 l6 -12 Z"
				fill={C.fff}
				stroke={INK}
				strokeWidth="2.5"
				strokeLinejoin="round"
			/>
		</g>
	);
}
