'use client';

import type { CreateTypes } from 'canvas-confetti';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

import { GRAPHIC_COLORS as C } from '@/config/graphicColors';

import { CAPTURE_MS, CaptureHand, type CaptureHandCue } from './arenaCapture';
import { ArenaStrike } from './ArenaStrike';
import type { ArenaCharacter } from './arenaCharacters';
import { STRIKE_HERO_SCALE, STRIKE_MS, type StrikeCue, type StrikePower } from './arenaStrikes';
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

export interface ArenaSuck {
	id: string;
	dx: number;
	dy: number;
	stage: 'pull' | 'held' | 'drop';
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

export function arenaPlayerElement(enrollmentId: string) {
	return document.querySelector(`[data-player-id="${CSS.escape(enrollmentId)}"]`);
}

/**
 * Where a hero's attack leaves from: the weapon point of the strike frame, at
 * the student's resting place and attack size. Layout offsets are used, not
 * the on-screen box, because the student may still be dropping from the mouth.
 */
function strikeOrigin(enrollmentId: string, hero: ArenaCharacter, target: { x: number }) {
	const player = arenaPlayerElement(enrollmentId);
	const figure = player?.querySelector<HTMLElement>('[data-character]');
	if (!(player instanceof HTMLElement) || !figure) return null;
	const floor = player.offsetParent?.getBoundingClientRect();
	// Without layout (a hidden floor) the on-screen box is the best there is.
	const box = figure.getBoundingClientRect();
	const left = floor
		? floor.left + player.offsetLeft - player.offsetWidth / 2 + figure.offsetLeft
		: box.left;
	const top = floor
		? floor.top + player.offsetTop - player.offsetHeight / 2 + figure.offsetTop
		: box.top;
	const width = floor ? figure.offsetWidth : box.width;
	const height = floor ? figure.offsetHeight : box.height;
	const facingLeft = target.x < left + width / 2;
	const originX = (facingLeft ? 100 - hero.origin[0] : hero.origin[0]) / 100;
	// The figure grows from its feet while it attacks.
	const feet = { x: left + width / 2, y: top + height };
	return {
		facingLeft,
		x: feet.x + (left + width * originX - feet.x) * STRIKE_HERO_SCALE,
		y: feet.y + (top + (height * hero.origin[1]) / 100 - feet.y) * STRIKE_HERO_SCALE,
	};
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
 * Screen-level juice: shake, flashes, floating numbers, sparks, the grab,
 * hero attacks and the boss banner. Everything is a no-op when `enabled` is false
 * (reduced motion), so the game logic never has to check.
 */
export function useArenaFx(enabled: boolean) {
	const worldRef = useRef<HTMLDivElement>(null);
	const counter = useRef(0);
	const timers = useRef<number[]>([]);
	const [pops, setPops] = useState<Pop[]>([]);
	const [flash, setFlash] = useState<{ id: number; tone: FxTone | 'white' } | null>(null);
	const [hand, setHand] = useState<CaptureHandCue | null>(null);
	const [suck, setSuck] = useState<ArenaSuck | null>(null);
	const [banner, setBanner] = useState<ArenaBanner | null>(null);
	const [strikeCue, setStrikeCue] = useState<StrikeCue | null>(null);

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
		(anchor: Element | null, tone: FxTone, count = 46, accent?: string) => {
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
					colors: accent ? [accent, accent, C.fff, ...SPARKS[tone]] : SPARKS[tone],
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

	const grab = useCallback(
		(id: string, monster: Element | null, scale: number) => {
			const figure = arenaPlayerElement(id)?.querySelector('[data-character]');
			if (!enabled || !monster || !figure) return;
			const to = centre(figure, 0.53);
			const boss = monster.getBoundingClientRect();
			const centerX = boss.left + boss.width / 2;
			const side = to.x < centerX ? -1 : 1;
			const from = {
				x: centerX + side * boss.width * 0.42,
				y: boss.top + boss.height * 0.66,
			};
			monster.animate?.(
				[
					{ rotate: '0deg' },
					{ rotate: `${side * -4}deg`, offset: 0.16 },
					{ rotate: `${side * 8}deg`, offset: 0.49 },
					{ rotate: `${side * 6}deg`, offset: 0.65 },
					{ rotate: '0deg' },
				],
				{ duration: CAPTURE_MS.grab, easing: 'ease-in-out' },
			);
			setHand({ from, to });
			setSuck({ id, dx: (from.x - to.x) / scale, dy: (from.y - to.y) / scale, stage: 'pull' });
		},
		[enabled],
	);

	const hold = useCallback(() => {
		setHand(null);
		setSuck((previous) => (previous ? { ...previous, stage: 'held' } : previous));
	}, []);

	/** Put the held student back on the floor. */
	const release = useCallback(() => {
		setSuck((previous) => {
			if (!previous) return previous;
			const { id } = previous;
			after(720, () => setSuck((latest) => (latest?.id === id ? null : latest)));
			return { ...previous, stage: 'drop' };
		});
	}, [after]);

	/**
	 * A hero attacks the boss. Returns which way the hero faces, or null when
	 * nothing is drawn (reduced motion, or the student is not on the floor).
	 */
	const strike = useCallback(
		(enrollmentId: string, monster: Element | null, hero: ArenaCharacter, power: StrikePower) => {
			if (!enabled || !monster) return null;
			const to = centre(monster, 0.52);
			const origin = strikeOrigin(enrollmentId, hero, to);
			if (!origin) return null;
			counter.current += 1;
			const id = counter.current;
			const edge = 240;
			setStrikeCue({
				id,
				from: { x: origin.x, y: origin.y },
				to,
				accent: hero.accent,
				effect: hero.effect,
				skill: hero.skill,
				power,
				align: origin.x < edge ? 'left' : origin.x > window.innerWidth - edge ? 'right' : undefined,
			});
			after(STRIKE_MS.end, () => setStrikeCue((latest) => (latest?.id === id ? null : latest)));
			return { facingLeft: origin.facingLeft };
		},
		[enabled, after],
	);

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
			{hand ? <CaptureHand {...hand} /> : null}
			{strikeCue ? <ArenaStrike key={strikeCue.id} cue={strikeCue} /> : null}
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
			grab,
			hold,
			release,
			announce,
			strike,
		}),
		[shake, flashScreen, pop, sparks, fireworks, grab, hold, release, announce, strike],
	);

	return { worldRef, suck, layer, ...actions };
}

/** CSS variables that carry the grab offset to the floor figure. */
export function suckStyle(suck: ArenaSuck | null, enrollmentId: string): CSSProperties {
	if (!suck || suck.id !== enrollmentId) return {};
	return {
		'--suck-x': `${suck.dx}px`,
		'--suck-y': `${suck.dy}px`,
		'--grab-ms': `${CAPTURE_MS.grab}ms`,
	} as CSSProperties;
}
