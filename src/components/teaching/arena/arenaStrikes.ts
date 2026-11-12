import type { ArenaEffect } from './arenaCharacters';

/**
 * One attack, in milliseconds from the moment the lecturer grades a pass.
 * The hero's sprite reaches its strike frame at `launch`; the shots land at
 * `impact`, which is when the boss loses the hit point.
 */
export const STRIKE_MS = { launch: 760, flight: 460, impact: 1220, end: 2050 } as const;

export interface StrikeShot {
	/** Sideways bow of the flight path, in px: negative curves left of the line. */
	bend: number;
	/** Delay after `launch`, in ms, so a volley lands as a drum roll. */
	delay: number;
}

interface StrikeStyle {
	/** Shot size in px at normal power. */
	size: number;
	shots: readonly StrikeShot[];
	/** Spinning shots tumble; the others keep pointing at the boss. */
	spin: boolean;
}

const volley = (bends: readonly number[], gap = 70): StrikeShot[] =>
	bends.map((bend, index) => ({ bend, delay: index * gap }));

/** How each effect flies. The shapes themselves live in `arenaStrike.module.css`. */
export const STRIKE_STYLES: Record<ArenaEffect, StrikeStyle> = {
	slash: { size: 84, spin: false, shots: volley([-46, 46], 110) },
	shield: { size: 78, spin: true, shots: volley([-70]) },
	moon: { size: 80, spin: true, shots: volley([-90]) },
	arrow: { size: 64, spin: false, shots: volley([-26, 0, 26], 80) },
	star: { size: 46, spin: true, shots: volley([-70, -34, 0, 34, 70], 55) },
	dumpling: { size: 52, spin: true, shots: volley([-110, -70, -140], 110) },
	ink: { size: 54, spin: true, shots: volley([-40, 30, -10], 80) },
	wind: { size: 76, spin: true, shots: volley([-60, 60], 120) },
	crystal: { size: 52, spin: false, shots: volley([-48, -16, 16, 48], 60) },
	smoke: { size: 62, spin: true, shots: volley([-55, 0, 55], 90) },
	music: { size: 72, spin: false, shots: volley([-34]) },
};

/** How much a hero grows, from the feet, while attacking. The floor's CSS reads it too. */
export const STRIKE_HERO_SCALE = 1.7;

/** 1 a normal hit, 2 a combo hit, 3 the blow that finishes the boss. */
export type StrikePower = 1 | 2 | 3;

export interface StrikeCue {
	id: number;
	/** Start and target, in px inside the layer the strike is drawn in. */
	from: { x: number; y: number };
	to: { x: number; y: number };
	accent: string;
	effect: ArenaEffect;
	skill: string;
	power: StrikePower;
	/** Which way the skill call-out grows, so it stays on screen near an edge. */
	align?: 'left' | 'right';
}

/** Travel distance and direction of a strike, for the CSS variables that move it. */
export function strikeGeometry(cue: Pick<StrikeCue, 'from' | 'to'>) {
	const dx = cue.to.x - cue.from.x;
	const dy = cue.to.y - cue.from.y;
	return {
		distance: Math.hypot(dx, dy),
		angle: (Math.atan2(dy, dx) * 180) / Math.PI,
	};
}
