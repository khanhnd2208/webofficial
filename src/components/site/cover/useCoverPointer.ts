import { useEffect, useRef, type RefObject } from 'react';

import type { CoverPointer } from './CoverAtmosphereCanvas';

const rest: CoverPointer = { x: 0.5, y: 0.5, vx: 0, vy: 0, active: false };

/** Sample the latest pointer position once per paint. The canvas and paper share it
 * without rerendering either picture, the note controls or the SVG starfield. */
export function useCoverPointer(frameRef: RefObject<HTMLDivElement | null>, enabled: boolean) {
	const pointerRef = useRef(rest);
	const lanternRef = useRef<SVGCircleElement>(null);

	useEffect(() => {
		const frame = frameRef.current;
		if (!frame || !enabled) return;
		let pending = 0;
		let latest: PointerEvent | null = null;
		let previous: PointerEvent | null = null;

		function paint() {
			pending = 0;
			if (!frame || !latest) return;
			const rect = frame.getBoundingClientRect();
			if (!rect.width || !rect.height) return;
			const x = Math.min(1, Math.max(0, (latest.clientX - rect.left) / rect.width));
			const y = Math.min(1, Math.max(0, (latest.clientY - rect.top) / rect.height));
			const dt = previous ? Math.max(latest.timeStamp - previous.timeStamp, 8) / 1000 : 1;
			const velocity = (delta: number) => Math.max(-900, Math.min(900, delta / dt));
			pointerRef.current = {
				x,
				y,
				active: true,
				vx: previous ? velocity(latest.clientX - previous.clientX) : 0,
				vy: previous ? velocity(latest.clientY - previous.clientY) : 0,
			};
			previous = latest;
			frame.dataset.coverPointer = 'true';
			frame.style.setProperty('--gaze-x', String(2 * x - 1));
			frame.style.setProperty('--gaze-y', String(2 * y - 1));
			lanternRef.current?.setAttribute('cx', String(x * rect.width));
			lanternRef.current?.setAttribute('cy', String(y * rect.height));
		}

		function move(event: PointerEvent) {
			if (event.pointerType === 'touch') return;
			latest = event;
			if (!pending) pending = requestAnimationFrame(paint);
		}

		function reset() {
			cancelAnimationFrame(pending);
			pending = 0;
			latest = previous = null;
			pointerRef.current = rest;
			if (!frame) return;
			delete frame.dataset.coverPointer;
			frame.style.removeProperty('--gaze-x');
			frame.style.removeProperty('--gaze-y');
		}

		frame.addEventListener('pointermove', move);
		frame.addEventListener('pointerleave', reset);
		frame.addEventListener('pointercancel', reset);
		return () => {
			frame.removeEventListener('pointermove', move);
			frame.removeEventListener('pointerleave', reset);
			frame.removeEventListener('pointercancel', reset);
			reset();
		};
	}, [enabled, frameRef]);

	return { pointerRef, lanternRef };
}
