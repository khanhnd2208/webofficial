'use client';

import type { CreateTypes } from 'canvas-confetti';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

import { GRAPHIC_COLORS as C } from '@/config/graphicColors';

import styles from './arena.module.css';

export type FxTone = 'damage' | 'heal' | 'gold';
export type ShakeLevel = 'soft' | 'hard';

interface Pop {
	id: number;
	text: string;
	tone: FxTone;
	x: number;
	y: number;
}

interface Beam {
	x: number;
	y: number;
	length: number;
	angle: number;
}

/**
 * The grab, step by step: `lock` puts a reticle on the student, `pull` flies
 * them into the monster's mouth, `held` keeps them off the floor while the
 * question is open, `drop` lands them back in their place.
 */
export interface ArenaSuck {
	id: string;
	dx: number;
	dy: number;
	stage: 'lock' | 'pull' | 'held' | 'drop';
}

export interface ArenaBanner {
	id: number;
	title: string;
	subtitle: string;
}

const SPARKS: Record<FxTone, string[]> = {
	damage: [C.fff, C.ffcc00, C.ff5500, C.dc2626],
	heal: [C.bbf7d0, C['34a853'], C.a7d9b3],
	gold: [C.ffd700, C.ffa500, C.fff8e0, C.fff],
};

/**
 * Confetti drawn on the main thread: the site's CSP has no worker-src, so the
 * library's default worker canvas would be blocked and log an error.
 */
let confettiPromise: Promise<CreateTypes> | null = null;
function loadConfetti() {
	confettiPromise ??= import('canvas-confetti').then(({ default: confetti }) =>
		confetti.create(undefined, { resize: true, useWorker: false }),
	);
	return confettiPromise;
}

function centre(element: Element, yRatio = 0.5) {
	const rect = element.getBoundingClientRect();
	return { x: rect.left + rect.width / 2, y: rect.top + rect.height * yRatio };
}

/** Where the monster's mouth is on screen. */
function mouthOf(monster: Element) {
	return centre(monster, 0.66);
}

export function arenaPlayerElement(enrollmentId: string) {
	return document.querySelector(`[data-player-id="${CSS.escape(enrollmentId)}"]`);
}

/** Pupil offset, in SVG units, so the monster looks at a student. */
export function lookToward(monster: Element | null, enrollmentId: string | null) {
	const target = enrollmentId ? arenaPlayerElement(enrollmentId) : null;
	if (!monster || !target) return { x: 0, y: 0 };
	const from = centre(monster, 0.42);
	const to = centre(target);
	const distance = Math.hypot(to.x - from.x, to.y - from.y) || 1;
	return { x: ((to.x - from.x) / distance) * 8, y: ((to.y - from.y) / distance) * 7 };
}

/**
 * Screen-level juice: shake, flashes, floating numbers, sparks, the tractor
 * beam and the boss banner. Everything is a no-op when `enabled` is false
 * (reduced motion), so the game logic never has to check.
 */
export function useArenaFx(enabled: boolean) {
	const worldRef = useRef<HTMLDivElement>(null);
	const counter = useRef(0);
	const timers = useRef<number[]>([]);
	const [pops, setPops] = useState<Pop[]>([]);
	const [flash, setFlash] = useState<{ id: number; tone: FxTone | 'white' } | null>(null);
	const [beam, setBeam] = useState<Beam | null>(null);
	const [suck, setSuck] = useState<ArenaSuck | null>(null);
	const [banner, setBanner] = useState<ArenaBanner | null>(null);

	useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);

	const after = useCallback((ms: number, run: () => void) => {
		timers.current.push(window.setTimeout(run, ms));
	}, []);

	const shake = useCallback(
		(level: ShakeLevel) => {
			const element = worldRef.current;
			if (!enabled || !element?.animate) return;
			const power = level === 'hard' ? 18 : 7;
			const twist = level === 'hard' ? 0.7 : 0.2;
			const frames: Keyframe[] = Array.from({ length: 10 }, (_, index) => {
				const decay = 1 - index / 10;
				const side = index % 2 ? 1 : -1;
				const x = side * power * decay;
				const y = (Math.random() - 0.5) * power * decay;
				return { transform: `translate(${x}px, ${y}px) rotate(${side * twist * decay}deg)` };
			});
			frames.push({ transform: 'none' });
			element.animate(frames, { duration: level === 'hard' ? 560 : 300, easing: 'linear' });
		},
		[enabled],
	);

	const flashScreen = useCallback(
		(tone: FxTone | 'white') => {
			if (!enabled) return;
			counter.current += 1;
			setFlash({ id: counter.current, tone });
		},
		[enabled],
	);

	const pop = useCallback(
		(text: string, tone: FxTone, anchor: Element | null, yRatio = 0.3) => {
			if (!enabled || !anchor) return;
			counter.current += 1;
			const id = counter.current;
			setPops((previous) => [...previous, { id, text, tone, ...centre(anchor, yRatio) }]);
			after(1500, () => setPops((previous) => previous.filter((item) => item.id !== id)));
		},
		[enabled, after],
	);

	const sparks = useCallback(
		(anchor: Element | null, tone: FxTone, count = 46) => {
			if (!enabled || !anchor) return;
			const point = centre(anchor, 0.55);
			void loadConfetti().then((confetti) => {
				confetti({
					particleCount: count,
					spread: 360,
					startVelocity: 28,
					gravity: 0.9,
					ticks: 70,
					scalar: 0.8,
					colors: SPARKS[tone],
					shapes: ['star', 'circle'],
					origin: { x: point.x / window.innerWidth, y: point.y / window.innerHeight },
					disableForReducedMotion: true,
				});
			});
		},
		[enabled],
	);

	const fireworks = useCallback(() => {
		void loadConfetti().then((confetti) => {
			confetti({ particleCount: 170, spread: 100, origin: { y: 0.35 } });
			if (!enabled) return;
			[
				[350, 0.18],
				[650, 0.82],
				[1000, 0.5],
				[1400, 0.3],
				[1750, 0.7],
			].forEach(([delay, x]) => {
				after(delay!, () => {
					confetti({
						particleCount: 90,
						spread: 360,
						startVelocity: 34,
						ticks: 110,
						colors: SPARKS.gold.concat(C.db2777, C['7c3aed'], C['2563eb']),
						origin: { x: x!, y: 0.2 + Math.random() * 0.25 },
					});
				});
			});
		});
	}, [enabled, after]);

	const lock = useCallback(
		(id: string) => {
			if (enabled) setSuck({ id, dx: 0, dy: 0, stage: 'lock' });
		},
		[enabled],
	);

	/** Fire the beam and pull the student into the monster's mouth. */
	const grab = useCallback(
		(id: string, monster: Element | null) => {
			const target = arenaPlayerElement(id);
			if (!enabled || !monster || !target) return;
			const mouth = mouthOf(monster);
			const body = centre(target, 0.4);
			const dx = mouth.x - body.x;
			const dy = mouth.y - body.y;
			setSuck({ id, dx, dy, stage: 'pull' });
			setBeam({
				x: mouth.x,
				y: mouth.y,
				length: Math.hypot(dx, dy),
				angle: (Math.atan2(-dy, -dx) * 180) / Math.PI,
			});
		},
		[enabled],
	);

	const hold = useCallback(() => {
		setBeam(null);
		setSuck((previous) => (previous ? { ...previous, stage: 'held' } : previous));
	}, []);

	/** Put the held student back on the floor. */
	const release = useCallback(() => {
		setBeam(null);
		setSuck((previous) => {
			if (!previous) return previous;
			const { id } = previous;
			after(720, () => setSuck((latest) => (latest?.id === id ? null : latest)));
			return { ...previous, stage: 'drop' };
		});
	}, [after]);

	const announce = useCallback(
		(title: string, subtitle: string) => {
			if (!enabled) return;
			counter.current += 1;
			setBanner({ id: counter.current, title, subtitle });
		},
		[enabled],
	);

	const layer = (
		<div className={styles.fxLayer} aria-hidden="true">
			{beam ? (
				<span
					className={styles.fxBeam}
					style={{
						left: beam.x,
						top: beam.y,
						width: beam.length,
						transform: `translateY(-50%) rotate(${beam.angle}deg)`,
					}}
				/>
			) : null}
			{flash ? (
				<span
					key={flash.id}
					className={styles.fxFlash}
					data-tone={flash.tone}
					onAnimationEnd={() => setFlash(null)}
				/>
			) : null}
			{pops.map((item) => (
				<span
					key={item.id}
					className={styles.fxPop}
					data-tone={item.tone}
					style={{ left: item.x, top: item.y }}
				>
					{item.text}
				</span>
			))}
			{banner ? (
				<div key={banner.id} className={styles.fxBanner} onAnimationEnd={() => setBanner(null)}>
					<span className={styles.fxBannerTitle}>{banner.title}</span>
					<span className={styles.fxBannerSub}>{banner.subtitle}</span>
				</div>
			) : null}
		</div>
	);

	const actions = useMemo(
		() => ({
			shake,
			flash: flashScreen,
			pop,
			sparks,
			fireworks,
			lock,
			grab,
			hold,
			release,
			announce,
		}),
		[shake, flashScreen, pop, sparks, fireworks, lock, grab, hold, release, announce],
	);

	return { worldRef, suck, layer, ...actions };
}

/** CSS variables that carry the grab offset to the floor figure. */
export function suckStyle(suck: ArenaSuck | null, enrollmentId: string): CSSProperties {
	if (!suck || suck.id !== enrollmentId) return {};
	return { '--suck-x': `${suck.dx}px`, '--suck-y': `${suck.dy}px` } as CSSProperties;
}
