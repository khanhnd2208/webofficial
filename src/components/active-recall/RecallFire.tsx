'use client';

import { useEffect, useRef, type RefObject } from 'react';

import { createFireEngine, type FireEngine } from './fireEngine';

import './recall-fire.css';

/**
 * Flames around the recall card. `flareKey` is set when the learner flips
 * to an answer, which makes the fire flare up for a moment.
 * Reduced-motion devices keep the static glow from CSS and skip the canvas.
 */
export default function RecallFire({
	cardRef,
	flareKey,
}: {
	cardRef: RefObject<HTMLElement | null>;
	flareKey: string | null;
}) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const engineRef = useRef<FireEngine | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		const card = cardRef.current;
		if (!canvas || !card) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		if (typeof ResizeObserver === 'undefined' || typeof IntersectionObserver === 'undefined')
			return;
		const engine = createFireEngine(canvas, card);
		engineRef.current = engine;
		return () => {
			engine.destroy();
			engineRef.current = null;
		};
	}, [cardRef]);

	useEffect(() => {
		if (flareKey) engineRef.current?.flare();
	}, [flareKey]);

	return <canvas ref={canvasRef} className="recall-fire" aria-hidden="true" />;
}
