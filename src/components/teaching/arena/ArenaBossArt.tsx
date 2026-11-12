import type { ReactNode } from 'react';

import { MonsterEyes, MonsterMouth } from './ArenaMonsterFace';
import type { ArenaBossDesign, MonsterMood } from './arenaBosses';
import styles from './arena.module.css';
import art from './arenaBoss.module.css';

/**
 * Hand-drawn bosses. Every design is drawn on the same 240×220 canvas around
 * the same face (eyes near y=94, mouth near y=154), so the shared eyes and
 * mouth, the mood animations and the pupils that follow a student work for
 * all of them. A design only supplies its silhouette; its colours live in
 * `arenaBoss.module.css`.
 */
interface BossParts {
	/** Behind everything: wings, flames, horns. */
	back?: ReactNode;
	/** The left arm; the right one is its mirror image. */
	arm: ReactNode;
	/** The left foot, mirrored for the right. Leave out for a boss that floats. */
	foot?: ReactNode;
	/** The body the face sits on. */
	torso: ReactNode;
	/** In front of the face: a crown, glasses, waves. */
	front?: ReactNode;
}

function Mirror({ children }: { children: ReactNode }) {
	return <g transform="translate(240 0) scale(-1 1)">{children}</g>;
}

const ROUND_BODY =
	'M120 34 C178 34 208 80 208 128 C208 180 172 204 120 204 C68 204 32 180 32 128 C32 80 62 34 120 34 Z';
const CLAWS = 'M14 154 l-5 15 l11 -9 l1 16 l9 -13 l6 13 l3 -18 Z';

const DESIGNS: Record<ArenaBossDesign, (body: string) => BossParts> = {
	/** A dozing dragon: wings, ear fins, a tail and a floppy nightcap. */
	dragon: (body) => ({
		back: (
			<>
				<Mirror>
					<path
						d="M64 110 Q30 84 8 28 Q34 40 50 34 Q48 56 66 58 Q64 76 84 84 Z"
						className={art.accent2}
					/>
					<path d="M64 110 Q40 70 8 28" className={art.line} strokeWidth="3" />
				</Mirror>
				<path
					d="M64 110 Q30 84 8 28 Q34 40 50 34 Q48 56 66 58 Q64 76 84 84 Z"
					className={art.accent2}
				/>
				<path d="M64 110 Q40 70 8 28" className={art.line} strokeWidth="3" />
				<path
					d="M190 168 Q226 184 230 152 Q231 142 238 138 L224 130 Q218 162 198 152 Z"
					fill={body}
				/>
				<path d="M222 132 L240 140 L238 116 Z" className={art.accent} />
			</>
		),
		arm: (
			<>
				<ellipse cx="32" cy="128" rx="21" ry="35" fill={body} />
				<path d={CLAWS} className={art.white} strokeWidth="3" />
			</>
		),
		foot: <ellipse cx="86" cy="202" rx="24" ry="10" fill={body} />,
		torso: (
			<>
				<path d="M42 100 Q14 88 10 60 Q32 64 50 80 Z" className={art.accent} />
				<Mirror>
					<path d="M42 100 Q14 88 10 60 Q32 64 50 80 Z" className={art.accent} />
				</Mirror>
				<path d={ROUND_BODY} fill={body} strokeWidth="5" />
				<ellipse cx="120" cy="160" rx="54" ry="38" className={art.soft} />
				<path
					d="M74 150 Q120 162 166 150 M82 170 Q120 182 158 170 M46 112 q6 -8 12 0 M182 112 q6 -8 12 0 M50 132 q6 -8 12 0 M178 132 q6 -8 12 0"
					className={art.line}
					strokeWidth="3"
					opacity="0.35"
				/>
				<circle cx="109" cy="122" r="3" className={art.ink} />
				<circle cx="131" cy="122" r="3" className={art.ink} />
			</>
		),
		front: (
			<>
				<path
					d="M80 42 Q100 0 150 8 Q190 16 208 46 Q184 32 164 42 Q120 20 80 42 Z"
					className={art.accent2}
				/>
				<path d="M72 56 Q120 28 168 56 L164 42 Q120 18 76 42 Z" className={art.white} />
				<circle cx="210" cy="50" r="10" className={art.white} />
			</>
		),
	}),

	/** An alarm clock on fire: bells for horns, the face on the dial. */
	clock: (body) => ({
		back: (
			<>
				<path
					d="M34 158 Q4 120 30 76 Q34 100 50 94 Q40 54 80 26 Q78 50 98 46 Q104 18 126 4 Q128 30 148 38 Q160 20 178 22 Q174 46 192 58 Q206 50 208 36 Q234 82 208 122 Q228 122 220 158 Z"
					className={art.accent}
				/>
				<path
					d="M34 158 Q4 120 30 76 Q34 100 50 94 Q40 54 80 26 Q78 50 98 46 Q104 18 126 4 Q128 30 148 38 Q160 20 178 22 Q174 46 192 58 Q206 50 208 36 Q234 82 208 122 Q228 122 220 158 Z"
					className={art.accent2}
					stroke="none"
					transform="translate(120 124) scale(0.76) translate(-120 -124)"
				/>
				<circle cx="64" cy="52" r="26" className={art.gold} />
				<circle cx="176" cy="52" r="26" className={art.gold} />
				<path d="M120 42 V18" className={art.line} strokeWidth="5" />
				<rect x="106" y="6" width="28" height="14" rx="6" className={art.gold} />
			</>
		),
		arm: (
			<>
				<ellipse cx="30" cy="130" rx="15" ry="30" fill={body} />
				<circle cx="26" cy="160" r="13" className={art.white} />
			</>
		),
		foot: <ellipse cx="84" cy="203" rx="22" ry="9" className={art.dark} />,
		torso: (
			<>
				<circle cx="120" cy="122" r="86" fill={body} strokeWidth="5" />
				<circle cx="120" cy="122" r="70" className={art.light} />
				<path
					d="M120 57 v9 M55 122 h9 M185 122 h-9 M73 76 l6 6 M167 76 l-6 6 M73 168 l6 -6 M167 168 l-6 -6"
					className={art.line}
				/>
				<path d="M120 126 V110 M120 126 L108 118" className={art.line} />
				<circle cx="120" cy="126" r="4" className={art.ink} />
			</>
		),
	}),

	/** A floating ghost with a ragged hem and two will-o'-the-wisps. */
	ghost: (body) => ({
		back: (
			<>
				<path
					d="M22 72 Q8 54 22 36 Q24 50 33 52 Q40 64 31 74 Q26 78 22 72 Z"
					className={art.accent}
				/>
				<path
					d="M214 96 Q202 80 214 64 Q216 76 224 78 Q230 88 222 98 Q218 101 214 96 Z"
					className={art.accent}
				/>
				<path d="M110 36 Q108 6 140 10 Q126 18 132 38 Z" fill={body} />
			</>
		),
		arm: <path d="M42 110 Q10 114 8 148 Q22 140 28 152 Q36 140 48 148 Z" fill={body} />,
		torso: (
			<>
				<path
					d="M120 30 C174 30 206 74 206 124 L206 192 Q192 208 178 194 Q164 180 150 194 Q136 208 120 194 Q104 180 90 194 Q76 208 62 194 Q48 180 34 192 L34 124 C34 74 66 30 120 30 Z"
					fill={body}
					strokeWidth="5"
				/>
				<ellipse cx="62" cy="130" rx="13" ry="7" className={art.blush} />
				<ellipse cx="178" cy="130" rx="13" ry="7" className={art.blush} />
			</>
		),
	}),

	/** A crowned king of water, the tide already at his feet. */
	wave: (body) => ({
		back: (
			<>
				<circle cx="24" cy="74" r="7" className={art.light} />
				<circle cx="216" cy="62" r="9" className={art.light} />
				<circle cx="228" cy="98" r="5" className={art.light} />
			</>
		),
		arm: (
			<path d="M40 116 Q8 110 6 142 Q4 166 24 168 Q20 152 30 148 Q40 146 46 152 Z" fill={body} />
		),
		torso: (
			<>
				<path
					d="M120 40 C176 40 208 82 208 130 C208 182 172 206 120 206 C68 206 32 182 32 130 C32 82 64 40 120 40 Z"
					fill={body}
					strokeWidth="5"
				/>
				<ellipse cx="184" cy="150" rx="7" ry="7" className={art.soft} />
				<ellipse cx="58" cy="158" rx="5" ry="5" className={art.soft} />
				<ellipse cx="176" cy="172" rx="4" ry="4" className={art.soft} />
			</>
		),
		front: (
			<>
				<path
					d="M84 52 L78 12 L100 30 L120 6 L140 30 L162 12 L156 52 Q120 38 84 52 Z"
					className={art.gold}
				/>
				<circle cx="120" cy="28" r="5.5" className={art.accent2} strokeWidth="2.5" />
				<circle cx="97" cy="38" r="3.5" className={art.accent2} strokeWidth="2" />
				<circle cx="143" cy="38" r="3.5" className={art.accent2} strokeWidth="2" />
				<path
					d="M6 202 Q22 184 38 202 Q54 218 70 202 Q86 184 102 202 Q118 218 134 202 Q150 184 166 202 Q182 218 198 202 Q214 184 234 202 L234 218 L6 218 Z"
					className={art.light}
				/>
			</>
		),
	}),

	/** A slime too lazy to hold its shape, hugging a pillow. */
	slime: (body) => ({
		back: (
			<>
				<path d="M70 60 Q50 52 52 28 Q72 34 90 48 Z" className={art.accent} />
				<Mirror>
					<path d="M70 60 Q50 52 52 28 Q72 34 90 48 Z" className={art.accent} />
				</Mirror>
				<g transform="rotate(-14 30 172)">
					<rect x="0" y="150" width="62" height="44" rx="13" className={art.white} />
					<path d="M16 152 V192 M32 151 V193 M48 152 V192" className={art.line} opacity="0.3" />
				</g>
			</>
		),
		arm: <ellipse cx="34" cy="142" rx="19" ry="31" fill={body} />,
		torso: (
			<>
				<path
					d="M120 40 C180 40 212 88 212 138 C212 170 206 186 216 196 Q218 206 204 206 L36 206 Q22 206 24 196 C34 186 28 170 28 138 C28 88 60 40 120 40 Z"
					fill={body}
					strokeWidth="5"
				/>
				<ellipse
					cx="82"
					cy="60"
					rx="20"
					ry="9"
					className={art.gloss}
					transform="rotate(-28 82 60)"
				/>
				<ellipse cx="186" cy="150" rx="8" ry="8" className={art.soft} />
				<ellipse cx="52" cy="166" rx="6" ry="6" className={art.soft} />
				<ellipse cx="170" cy="184" rx="5" ry="5" className={art.soft} />
			</>
		),
	}),

	/** A spell book that bites: cover, spine, page edges and a ribbon. */
	book: (body) => ({
		back: <path d="M150 44 V6 l11 9 l11 -9 V44 Z" className={art.accent2} />,
		arm: (
			<>
				<ellipse cx="24" cy="130" rx="15" ry="30" fill={body} />
				<path d={CLAWS} className={art.white} strokeWidth="3" transform="translate(-6 2)" />
			</>
		),
		foot: <ellipse cx="86" cy="204" rx="22" ry="9" className={art.dark} />,
		torso: (
			<>
				<rect x="46" y="40" width="166" height="166" rx="10" className={art.light} />
				<path d="M205 54 V198 M199 50 V202" className={art.line} strokeWidth="2" opacity="0.35" />
				<rect x="30" y="32" width="168" height="170" rx="14" fill={body} strokeWidth="5" />
				<path d="M54 35 V199" className={art.line} strokeWidth="3" opacity="0.45" />
				<rect x="30" y="62" width="24" height="10" className={art.gold} strokeWidth="3" />
				<rect x="30" y="160" width="24" height="10" className={art.gold} strokeWidth="3" />
				<path d="M198 58 V46 Q198 32 184 32 H172 Z" className={art.gold} strokeWidth="3" />
				<path d="M198 176 V188 Q198 202 184 202 H172 Z" className={art.gold} strokeWidth="3" />
			</>
		),
	}),

	/** A night owl in round glasses, still awake at 3 a.m. */
	owl: (body) => ({
		back: (
			<>
				<path d="M58 72 Q38 42 48 12 Q70 28 98 46 Z" fill={body} />
				<Mirror>
					<path d="M58 72 Q38 42 48 12 Q70 28 98 46 Z" fill={body} />
				</Mirror>
			</>
		),
		arm: (
			<path
				d="M42 102 Q6 120 12 174 Q24 164 30 174 Q36 162 48 170 Q54 140 54 112 Z"
				className={art.dark}
			/>
		),
		foot: <ellipse cx="86" cy="204" rx="20" ry="8" className={art.accent} />,
		torso: (
			<>
				<path d={ROUND_BODY} fill={body} strokeWidth="5" />
				<ellipse cx="120" cy="160" rx="50" ry="38" className={art.soft} />
				<path
					d="M120 76 Q96 52 64 70 Q52 100 76 122 Q104 132 120 112 Q136 132 164 122 Q188 100 176 70 Q144 52 120 76 Z"
					className={art.gloss}
				/>
				<path d="M112 110 L128 110 L120 124 Z" className={art.accent} strokeWidth="3" />
			</>
		),
		front: (
			<>
				<circle cx="88" cy="94" r="29" className={art.rim} />
				<circle cx="152" cy="94" r="29" className={art.rim} />
				<path d="M117 92 h6" className={art.rim} />
			</>
		),
	}),
};

export function VectorBoss({
	id,
	design,
	mood,
	name,
	enraged,
	angry,
	look,
}: {
	id: string;
	design: ArenaBossDesign;
	mood: MonsterMood;
	name: string;
	enraged: boolean;
	angry: boolean;
	look?: { x: number; y: number };
}) {
	const defeated = mood === 'defeated';
	const parts = DESIGNS[design](`url(#${id}-body)`);
	return (
		<svg viewBox="0 0 240 220" role="img" aria-label={name}>
			<defs>
				<radialGradient id={`${id}-body`} cx="36%" cy="26%" r="85%">
					<stop offset="0" className={art.stop1} />
					<stop offset="0.5" className={art.stop2} />
					<stop offset="1" className={art.stop3} />
				</radialGradient>
			</defs>
			<ellipse className={styles.monsterShadow} cx="120" cy="211" rx="84" ry="8" />
			<g className={art.parts}>
				{parts.back}
				<g className={styles.monsterArmLeft}>{parts.arm}</g>
				<g className={styles.monsterArmRight}>
					<Mirror>{parts.arm}</Mirror>
				</g>
				{parts.foot}
				{parts.foot ? <Mirror>{parts.foot}</Mirror> : null}
				{parts.torso}
			</g>
			<MonsterEyes mood={mood} angry={angry} enraged={enraged} look={look} />
			<MonsterMouth mood={mood} />
			{mood === 'hurt' ? (
				<g className={`${styles.monsterSlash} ${art.slash}`}>
					<path d="M58 60 L186 176" strokeWidth="10" />
					<path d="M84 50 L198 150" strokeWidth="5" />
					<path d="M46 86 L160 190" strokeWidth="5" />
				</g>
			) : null}
			{parts.front ? <g className={art.parts}>{parts.front}</g> : null}
			{enraged && !defeated ? (
				<g className={`${styles.monsterSteam} ${art.steam}`}>
					<circle cx="36" cy="40" r="7" />
					<circle cx="26" cy="26" r="5" />
					<circle cx="204" cy="40" r="7" />
					<circle cx="214" cy="26" r="5" />
				</g>
			) : null}
			{defeated ? (
				<g className={`${styles.monsterDizzy} ${art.dizzy}`}>
					<path d="M70 22 l4 9 l10 1 l-8 6 l3 10 l-9 -6 l-9 6 l3 -10 l-8 -6 l10 -1 Z" />
					<path d="M170 22 l4 9 l10 1 l-8 6 l3 10 l-9 -6 l-9 6 l3 -10 l-8 -6 l10 -1 Z" />
				</g>
			) : null}
		</svg>
	);
}
