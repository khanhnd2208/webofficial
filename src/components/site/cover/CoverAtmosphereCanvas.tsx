'use client';

import { useEffect, useRef } from 'react';

import {
	DESKTOP_CONSTELLATION,
	DESKTOP_JOURNEY_POINTS,
	DESKTOP_LEAVES,
	DESKTOP_SUN_POS,
	MOBILE_CONSTELLATION,
	MOBILE_SUN_POS,
	type CoverAtmosphere,
} from './coverAtmosphere';

export interface TransitionPulse {
	id: number;
	from: CoverAtmosphere;
	to: CoverAtmosphere;
	/** Normalized 0..1 coordinates of bloom origin. */
	originX: number;
	originY: number;
	startTime: number;
	durationMs: number;
}

interface CoverAtmosphereCanvasProps {
	atmosphere: CoverAtmosphere;
	isDesktop: boolean;
	allowsAmbient: boolean;
	reduced: boolean;
	pointer: { x: number; y: number; vx: number; vy: number; active: boolean };
	pulse: TransitionPulse | null;
	hasInteracted: boolean;
}

interface LeafPhysics {
	ox: number;
	oy: number;
	vx: number;
	vy: number;
	angleOffset: number;
	vAngle: number;
}

interface DustMote {
	x: number;
	y: number;
	speedX: number;
	speedY: number;
	r: number;
	phase: number;
	alpha: number;
}

function createInitialMotes(): DustMote[] {
	const motes: DustMote[] = [];
	for (let i = 0; i < 14; i += 1) {
		const seed = (i + 1) * 1.6180339;
		motes.push({
			x: (seed * 0.73) % 1,
			y: 0.08 + ((seed * 0.41) % 0.84),
			speedX: 0.004 + (i % 4) * 0.0018,
			speedY: -(0.005 + (i % 3) * 0.0024),
			r: 1.0 + (i % 3) * 0.45,
			phase: i * 0.9,
			alpha: 0.16 + (i % 4) * 0.05,
		});
	}
	return motes;
}

function drawWatercolorLeaf(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	size: number,
	angle: number,
	isNight: boolean,
) {
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(angle);
	ctx.beginPath();
	ctx.moveTo(-size * 0.65, 0);
	ctx.bezierCurveTo(-size * 0.2, -size * 0.46, size * 0.32, -size * 0.36, size * 0.68, 0);
	ctx.bezierCurveTo(size * 0.32, size * 0.36, -size * 0.2, size * 0.46, -size * 0.65, 0);
	ctx.closePath();
	ctx.fillStyle = isNight ? 'rgba(218, 178, 102, 0.42)' : 'rgba(202, 156, 74, 0.56)';
	ctx.fill();
	ctx.strokeStyle = isNight ? 'rgba(232, 214, 178, 0.52)' : 'rgba(28, 24, 20, 0.48)';
	ctx.lineWidth = 0.95;
	ctx.stroke();

	// Delicate ink center vein
	ctx.beginPath();
	ctx.moveTo(-size * 0.45, 0);
	ctx.lineTo(size * 0.46, 0);
	ctx.strokeStyle = isNight ? 'rgba(232, 214, 178, 0.35)' : 'rgba(28, 24, 20, 0.32)';
	ctx.lineWidth = 0.7;
	ctx.stroke();
	ctx.restore();
}

/**
 * Living atmospheric canvas for BOTH Dawn & Night:
 * - Dawn: sunlit library dust motes, spring-physics wind-reactive hand-drawn leaves,
 *   breathing golden sun corona & extending beams on hover, tactile winding-road sheen.
 * - Night: warm candlelit amber lantern, magnetic constellation filaments, slow-rising
 *   twilight stardust, and gentle lunar corona on hover.
 * - Fallback transition: organic antique-gold watercolor frontier when View Transitions are absent.
 * Automatically pauses when tab is hidden or under reduced-motion / lite tiers.
 */
export default function CoverAtmosphereCanvas({
	atmosphere,
	isDesktop,
	allowsAmbient,
	reduced,
	pointer,
	pulse,
	hasInteracted,
}: CoverAtmosphereCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const pointerRef = useRef(pointer);
	const pulseRef = useRef(pulse);
	const atmosphereRef = useRef(atmosphere);
	const isDesktopRef = useRef(isDesktop);
	const hasInteractedRef = useRef(hasInteracted);
	const leavesRef = useRef<LeafPhysics[]>(
		DESKTOP_LEAVES.map(() => ({ ox: 0, oy: 0, vx: 0, vy: 0, angleOffset: 0, vAngle: 0 })),
	);
	const motesRef = useRef<DustMote[]>(createInitialMotes());
	const sunWarmthRef = useRef(0);
	const mountTimeRef = useRef(0);

	useEffect(() => {
		pointerRef.current = pointer;
	}, [pointer]);

	useEffect(() => {
		pulseRef.current = pulse;
	}, [pulse]);

	useEffect(() => {
		atmosphereRef.current = atmosphere;
	}, [atmosphere]);

	useEffect(() => {
		isDesktopRef.current = isDesktop;
	}, [isDesktop]);

	useEffect(() => {
		hasInteractedRef.current = hasInteracted;
	}, [hasInteracted]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || reduced) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		if (!mountTimeRef.current) mountTimeRef.current = performance.now();

		let rafId = 0;
		let lastTime = performance.now();
		let hidden = document.hidden;

		const resize = () => {
			const rect = canvas.getBoundingClientRect();
			if (!rect.width || !rect.height) return;
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			canvas.width = Math.round(rect.width * dpr);
			canvas.height = Math.round(rect.height * dpr);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		};

		resize();
		const observer = new ResizeObserver(resize);
		observer.observe(canvas);

		const onVisibilityChange = () => {
			hidden = document.hidden;
			if (!hidden) {
				lastTime = performance.now();
				kick();
			}
		};
		document.addEventListener('visibilitychange', onVisibilityChange);

		const draw = (now: number) => {
			rafId = 0;
			if (hidden) return;
			const rect = canvas.getBoundingClientRect();
			const w = rect.width;
			const h = rect.height;
			if (!w || !h) return;

			const dt = Math.min((now - lastTime) / 1000, 0.05);
			lastTime = now;
			const sec = now / 1000;

			ctx.clearRect(0, 0, w, h);

			const mode = atmosphereRef.current;
			const isNight = mode === 'night';
			const ptr = pointerRef.current;
			const px = ptr.x * w;
			const py = ptr.y * h;
			const sunPos = isDesktopRef.current ? DESKTOP_SUN_POS : MOBILE_SUN_POS;
			const sunX = (sunPos.x / 100) * w;
			const sunY = (sunPos.y / 100) * h;

			// 1) Gentle celestial corona & extending beams when hovering near sun/moon (+ 1 welcoming pulse at ~2.2s)
			const elapsedSinceMount = (now - mountTimeRef.current) / 1000;
			const welcomePulse =
				!hasInteractedRef.current && elapsedSinceMount > 1.8 && elapsedSinceMount < 3.6
					? Math.sin(((elapsedSinceMount - 1.8) / 1.8) * Math.PI) * 0.55
					: 0;
			const sunDist = ptr.active ? Math.hypot(px - sunX, py - sunY) : Infinity;
			const sunProximity = ptr.active ? Math.max(0, 1 - sunDist / (Math.min(w, h) * 0.28)) : 0;
			const targetWarmth = Math.max(sunProximity, welcomePulse);
			sunWarmthRef.current += (targetWarmth - sunWarmthRef.current) * Math.min(1, dt * 6);
			const warmth = sunWarmthRef.current;

			if (warmth > 0.015) {
				const baseR = Math.min(w, h) * 0.088;
				const haloR = baseR * (1.85 + warmth * 0.72);
				const corona = ctx.createRadialGradient(sunX, sunY, baseR * 0.55, sunX, sunY, haloR);
				const peak = isNight ? 0.24 * warmth : 0.21 * warmth;
				corona.addColorStop(0, `rgba(218, 174, 88, ${peak.toFixed(3)})`);
				corona.addColorStop(0.55, `rgba(204, 158, 76, ${(peak * 0.45).toFixed(3)})`);
				corona.addColorStop(1, 'rgba(204, 158, 76, 0)');
				ctx.fillStyle = corona;
				ctx.beginPath();
				ctx.arc(sunX, sunY, haloR, 0, Math.PI * 2);
				ctx.fill();

				// Delicate breathing radiant rays
				ctx.save();
				ctx.strokeStyle = isNight
					? `rgba(238, 206, 138, ${(0.34 * warmth).toFixed(3)})`
					: `rgba(176, 128, 48, ${(0.36 * warmth).toFixed(3)})`;
				ctx.lineWidth = 1;
				ctx.lineCap = 'round';
				const rayCount = 10;
				const slowSpin = sec * 0.06;
				for (let i = 0; i < rayCount; i += 1) {
					const angle = (i / rayCount) * Math.PI * 2 + slowSpin;
					const r0 = baseR * 1.12;
					const r1 = baseR * (1.42 + warmth * 0.34 + (i % 2) * 0.14);
					ctx.beginPath();
					ctx.moveTo(sunX + Math.cos(angle) * r0, sunY + Math.sin(angle) * r0);
					ctx.lineTo(sunX + Math.cos(angle) * r1, sunY + Math.sin(angle) * r1);
					ctx.stroke();
				}
				ctx.restore();
			}

			// 2) Ambient drifting dust motes (Dawn sunlit library motes / Night twilight specks)
			if (allowsAmbient) {
				const motes = motesRef.current;
				for (let i = 0; i < motes.length; i += 1) {
					const m = motes[i];
					m.x = (m.x + m.speedX * dt + 1) % 1;
					m.y = m.y + m.speedY * dt;
					if (m.y < 0.04) m.y = 0.94;

					let mx = m.x * w + Math.sin(sec * 0.65 + m.phase) * 7;
					let my = m.y * h + Math.cos(sec * 0.52 + m.phase) * 5;

					// Gentle parting ripple when pointer glides past motes
					if (ptr.active) {
						const dx = mx - px;
						const dy = my - py;
						const d = Math.hypot(dx, dy);
						const pushR = 92;
						if (d > 1 && d < pushR) {
							const force = (1 - d / pushR) * 14;
							mx += (dx / d) * force;
							my += (dy / d) * force;
						}
					}

					const breathe = 0.6 + 0.4 * Math.sin(sec * 1.1 + m.phase);
					const a = m.alpha * breathe * (isNight ? 1.05 : 1.15);
					ctx.fillStyle = isNight
						? `rgba(238, 212, 152, ${a.toFixed(3)})`
						: `rgba(186, 138, 54, ${a.toFixed(3)})`;
					ctx.beginPath();
					ctx.arc(mx, my, m.r, 0, Math.PI * 2);
					ctx.fill();
				}
			}

			// 3) Dawn tactile physics: wind-reactive hand-drawn leaves + localized road shimmer
			if (allowsAmbient && isDesktopRef.current && !isNight) {
				const states = leavesRef.current;
				for (let i = 0; i < DESKTOP_LEAVES.length; i += 1) {
					const anchor = DESKTOP_LEAVES[i];
					const st = states[i];
					const ax = anchor.x * w;
					const ay = anchor.y * h;
					const idleX = Math.sin(sec * 0.72 + anchor.phase) * 5;
					const idleY = Math.cos(sec * 0.58 + anchor.phase) * 4;
					const lx = ax + idleX + st.ox;
					const ly = ay + idleY + st.oy;

					if (ptr.active) {
						const dx = lx - px;
						const dy = ly - py;
						const dist = Math.hypot(dx, dy);
						const windRadius = 150;
						if (dist < windRadius) {
							const influence = Math.pow(1 - dist / windRadius, 1.4);
							st.vx += (ptr.vx * 0.32 + (dx / Math.max(dist, 12)) * 22) * influence * dt;
							st.vy += (ptr.vy * 0.32 + (dy / Math.max(dist, 12)) * 18) * influence * dt;
							st.vAngle += (ptr.vx * 0.015 + (dx > 0 ? 1.4 : -1.4)) * influence * dt;
						}
					}

					// Soft spring back toward anchor + gentle air damping
					const spring = 3.2;
					const damping = Math.exp(-2.6 * dt);
					st.vx = (st.vx - st.ox * spring * dt) * damping;
					st.vy = (st.vy - st.oy * spring * dt) * damping;
					st.vAngle = (st.vAngle - st.angleOffset * 3.8 * dt) * Math.exp(-3.1 * dt);
					st.ox = Math.max(-36, Math.min(36, st.ox + st.vx * dt));
					st.oy = Math.max(-28, Math.min(28, st.oy + st.vy * dt));
					st.angleOffset = Math.max(-1.1, Math.min(1.1, st.angleOffset + st.vAngle * dt));

					const angle =
						anchor.baseAngle + Math.sin(sec * 0.9 + anchor.phase) * 0.14 + st.angleOffset;
					drawWatercolorLeaf(
						ctx,
						ax + idleX + st.ox,
						ay + idleY + st.oy,
						anchor.size,
						angle,
						false,
					);
				}

				// Tactile golden sheen along the nearest winding-road segment on hover
				if (ptr.active) {
					const roadRadius = Math.min(w, h) * 0.24;
					ctx.save();
					ctx.lineCap = 'round';
					for (let i = 0; i < DESKTOP_JOURNEY_POINTS.length - 1; i += 1) {
						const a = DESKTOP_JOURNEY_POINTS[i];
						const b = DESKTOP_JOURNEY_POINTS[i + 1];
						const mx = (a.x + b.x) * 0.5 * w;
						const my = (a.y + b.y) * 0.5 * h;
						const d = Math.hypot(px - mx, py - my);
						if (d < roadRadius) {
							const glow = Math.pow(1 - d / roadRadius, 1.5);
							ctx.strokeStyle = `rgba(202, 152, 62, ${(glow * 0.44).toFixed(3)})`;
							ctx.lineWidth = 4 + glow * 5;
							ctx.beginPath();
							ctx.moveTo(a.x * w, a.y * h);
							ctx.lineTo(b.x * w, b.y * h);
							ctx.stroke();
						}
					}
					ctx.restore();
				}
			}

			// 4) Night magnetic constellation filaments + warm candlelit lantern
			if (allowsAmbient && isNight && ptr.active) {
				const stars = isDesktopRef.current ? DESKTOP_CONSTELLATION : MOBILE_CONSTELLATION;
				const threshold = Math.min(w, h) * 0.34;

				const lanternR = Math.min(w, h) * 0.145;
				const lantern = ctx.createRadialGradient(px, py, 0, px, py, lanternR);
				lantern.addColorStop(0, 'rgba(222, 178, 96, 0.21)');
				lantern.addColorStop(0.52, 'rgba(200, 157, 75, 0.08)');
				lantern.addColorStop(1, 'rgba(200, 157, 75, 0)');
				ctx.fillStyle = lantern;
				ctx.beginPath();
				ctx.arc(px, py, lanternR, 0, Math.PI * 2);
				ctx.fill();

				ctx.save();
				ctx.lineCap = 'round';
				for (const star of stars) {
					const sx = (star.x / 1000) * w;
					const sy = (star.y / 1000) * h;
					const dist = Math.hypot(px - sx, py - sy);
					if (dist < threshold) {
						const strength = 1 - dist / threshold;
						ctx.strokeStyle = `rgba(232, 198, 134, ${(strength * 0.36).toFixed(3)})`;
						ctx.lineWidth = 0.9;
						ctx.beginPath();
						ctx.moveTo(sx, sy);
						ctx.lineTo(px, py);
						ctx.stroke();

						ctx.fillStyle = `rgba(246, 226, 178, ${(strength * 0.6).toFixed(3)})`;
						ctx.beginPath();
						ctx.arc(sx, sy, 2.2 + strength * 1.5, 0, Math.PI * 2);
						ctx.fill();
					}
				}
				ctx.restore();
			}

			// 5) Fallback transition pulse halo (for browsers without View Transitions API)
			const activePulse = pulseRef.current;
			let pulseRunning = false;
			if (activePulse) {
				const rawT = (now - activePulse.startTime) / activePulse.durationMs;
				if (rawT >= 0 && rawT <= 1.05) {
					pulseRunning = true;
					const t = Math.min(Math.max(rawT, 0), 1);
					const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
					const ox = activePulse.originX * w;
					const oy = activePulse.originY * h;
					const maxRadius =
						Math.max(
							Math.hypot(ox, oy),
							Math.hypot(w - ox, oy),
							Math.hypot(ox, h - oy),
							Math.hypot(w - ox, h - oy),
						) + 48;
					const progress = activePulse.to === 'dawn' ? eased : 1 - eased;
					const radius = Math.max(8, progress * maxRadius);
					const fade = Math.sin(t * Math.PI);

					const bandWidth = Math.max(26, Math.min(w, h) * 0.085);
					const grad = ctx.createRadialGradient(
						ox,
						oy,
						Math.max(0, radius - bandWidth * 0.65),
						ox,
						oy,
						radius + bandWidth * 0.75,
					);
					const peakAlpha = (activePulse.to === 'dawn' ? 0.24 : 0.17) * fade;
					grad.addColorStop(0, 'rgba(200, 157, 75, 0)');
					grad.addColorStop(0.45, `rgba(216, 174, 96, ${peakAlpha.toFixed(3)})`);
					grad.addColorStop(1, 'rgba(200, 157, 75, 0)');

					ctx.save();
					ctx.beginPath();
					ctx.arc(ox, oy, radius, 0, Math.PI * 2);
					ctx.strokeStyle = grad;
					ctx.lineWidth = bandWidth;
					ctx.stroke();
					ctx.restore();
				}
			}

			if (allowsAmbient || pulseRunning || welcomePulse > 0.01) {
				rafId = requestAnimationFrame(draw);
			}
		};

		const kick = () => {
			if (!rafId && !hidden) {
				rafId = requestAnimationFrame(draw);
			}
		};

		kick();

		return () => {
			if (rafId) cancelAnimationFrame(rafId);
			observer.disconnect();
			document.removeEventListener('visibilitychange', onVisibilityChange);
		};
	}, [allowsAmbient, reduced, pulse]);

	return <canvas ref={canvasRef} className="cover-atmosphere-canvas" aria-hidden="true" />;
}
