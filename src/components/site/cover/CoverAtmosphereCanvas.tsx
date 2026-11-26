'use client';

import { useEffect, useRef } from 'react';

import {
	DESKTOP_CONSTELLATION,
	MOBILE_CONSTELLATION,
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
	pointer: { x: number; y: number; active: boolean };
	pulse: TransitionPulse | null;
}

/**
 * Lightweight atmospheric canvas layered over the bookplate:
 * - Renders an organic antique-gold watercolor halo & tiny dissolving specks along
 *   the moving reveal frontier during Night <-> Dawn transitions.
 * - Renders whisper-thin magnetic constellation filaments near the pointer in Night mode.
 * Stops its rAF loop automatically when idle (0% idle CPU).
 */
export default function CoverAtmosphereCanvas({
	atmosphere,
	isDesktop,
	allowsAmbient,
	reduced,
	pointer,
	pulse,
}: CoverAtmosphereCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const pointerRef = useRef(pointer);
	const pulseRef = useRef(pulse);
	const atmosphereRef = useRef(atmosphere);
	const isDesktopRef = useRef(isDesktop);

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
		const canvas = canvasRef.current;
		if (!canvas || reduced) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		let rafId = 0;
		let running = false;

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

		const draw = (now: number) => {
			const rect = canvas.getBoundingClientRect();
			const w = rect.width;
			const h = rect.height;
			if (!w || !h) {
				running = false;
				return;
			}
			ctx.clearRect(0, 0, w, h);

			let needsNextFrame = false;
			const activePulse = pulseRef.current;

			// 1) Organic antique-gold watercolor halo along the reveal frontier
			if (activePulse) {
				const rawT = (now - activePulse.startTime) / activePulse.durationMs;
				if (rawT >= 0 && rawT <= 1.05) {
					const t = Math.min(Math.max(rawT, 0), 1);
					// Smooth S-curve so the watercolor bloom opens visibly and unhurriedly
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

					// Soft golden watercolor edge band (no harsh white rings)
					const bandWidth = Math.max(26, Math.min(w, h) * 0.085);
					const innerR = Math.max(0, radius - bandWidth * 0.65);
					const outerR = radius + bandWidth * 0.75;
					const grad = ctx.createRadialGradient(ox, oy, innerR, ox, oy, outerR);
					const peakAlpha = (activePulse.to === 'dawn' ? 0.24 : 0.17) * fade;
					grad.addColorStop(0, 'rgba(200, 157, 75, 0)');
					grad.addColorStop(0.42, `rgba(216, 174, 96, ${peakAlpha.toFixed(3)})`);
					grad.addColorStop(0.68, `rgba(232, 213, 176, ${(peakAlpha * 0.55).toFixed(3)})`);
					grad.addColorStop(1, 'rgba(200, 157, 75, 0)');

					ctx.save();
					ctx.beginPath();
					const segments = 56;
					for (let i = 0; i <= segments; i++) {
						const angle = (i / segments) * Math.PI * 2;
						// Gentle organic rag-paper wave along the circumference
						const wobble =
							Math.sin(angle * 5 + t * 2.2) * 7 +
							Math.cos(angle * 9 - t * 1.6) * 4 +
							Math.sin(angle * 13 + activePulse.id) * 2.5;
						const r = Math.max(4, radius + wobble * fade);
						const px = ox + Math.cos(angle) * r;
						const py = oy + Math.sin(angle) * r;
						if (i === 0) ctx.moveTo(px, py);
						else ctx.lineTo(px, py);
					}
					ctx.closePath();
					ctx.strokeStyle = grad;
					ctx.lineWidth = bandWidth;
					ctx.stroke();

					// Tiny dissolving antique-gold paper specks riding the edge
					const speckCount = 14;
					for (let i = 0; i < speckCount; i++) {
						const angle = (i / speckCount) * Math.PI * 2 + t * 0.28 + activePulse.id * 0.7;
						const drift = Math.sin(i * 3.1 + t * 4) * 14;
						const sx = ox + Math.cos(angle) * (radius + drift);
						const sy = oy + Math.sin(angle) * (radius + drift);
						const sr = 1 + (i % 3) * 0.45;
						ctx.fillStyle = `rgba(232, 200, 128, ${(0.34 * fade).toFixed(3)})`;
						ctx.beginPath();
						ctx.arc(sx, sy, sr, 0, Math.PI * 2);
						ctx.fill();
					}
					ctx.restore();
					needsNextFrame = true;
				}
			}

			// 2) Night magnetic constellation filaments + warm lantern aura on pointer hover
			const ptr = pointerRef.current;
			if (allowsAmbient && atmosphereRef.current === 'night' && ptr.active) {
				const px = ptr.x * w;
				const py = ptr.y * h;
				const stars = isDesktopRef.current ? DESKTOP_CONSTELLATION : MOBILE_CONSTELLATION;
				const threshold = Math.min(w, h) * 0.34;

				// Whisper-soft warm candlelit amber lantern tint at cursor
				const lanternR = Math.min(w, h) * 0.145;
				const lantern = ctx.createRadialGradient(px, py, 0, px, py, lanternR);
				lantern.addColorStop(0, 'rgba(222, 178, 96, 0.22)');
				lantern.addColorStop(0.5, 'rgba(200, 157, 75, 0.09)');
				lantern.addColorStop(1, 'rgba(200, 157, 75, 0)');
				ctx.fillStyle = lantern;
				ctx.beginPath();
				ctx.arc(px, py, lanternR, 0, Math.PI * 2);
				ctx.fill();

				// Connect nearby constellation stars with delicate golden threads
				ctx.save();
				ctx.lineCap = 'round';
				for (const star of stars) {
					const sx = (star.x / 1000) * w;
					const sy = (star.y / 1000) * h;
					const dist = Math.hypot(px - sx, py - sy);
					if (dist < threshold) {
						const strength = 1 - dist / threshold;
						ctx.strokeStyle = `rgba(228, 196, 132, ${(strength * 0.32).toFixed(3)})`;
						ctx.lineWidth = 0.85;
						ctx.beginPath();
						ctx.moveTo(sx, sy);
						ctx.lineTo(px, py);
						ctx.stroke();

						ctx.fillStyle = `rgba(244, 224, 174, ${(strength * 0.55).toFixed(3)})`;
						ctx.beginPath();
						ctx.arc(sx, sy, 2.2 + strength * 1.4, 0, Math.PI * 2);
						ctx.fill();
					}
				}
				ctx.restore();
			}

			if (needsNextFrame) {
				rafId = requestAnimationFrame(draw);
			} else {
				running = false;
			}
		};

		const kick = () => {
			if (!running) {
				running = true;
				rafId = requestAnimationFrame(draw);
			}
		};

		kick();

		return () => {
			cancelAnimationFrame(rafId);
			observer.disconnect();
		};
	}, [allowsAmbient, reduced, atmosphere, isDesktop, pointer.active, pointer.x, pointer.y, pulse]);

	return <canvas ref={canvasRef} className="cover-atmosphere-canvas" aria-hidden="true" />;
}
