import { useEffect, useRef, type RefObject } from 'react';

import type { CoverPointer } from './CoverAtmosphereCanvas';

const rest: CoverPointer = { x: 0.5, y: 0.5, vx: 0, vy: 0, active: false };

/**
 * Sample the latest pointer position once per animation frame outside React, caching the
 * frame rect across moves so parallax and canvas physics never trigger forced layout reflows.
 */
export function useCoverPointer(frameRef: RefObject<HTMLDivElement | null>, enabled: boolean) {
	const pointerRef = useRef<CoverPointer>(rest);

	useEffect(() => {
		const frame = frameRef.current;
		if (!frame || !enabled) return;

		let pending = 0;
		let latest: PointerEvent | null = null;
		let previous: PointerEvent | null = null;
		let cachedRect: DOMRect | null = null;

		function invalidateRect() {
			cachedRect = null;
		}

		function readRect(): DOMRect | null {
			if (!frame) return null;
			if (!cachedRect) cachedRect = frame.getBoundingClientRect();
			return cachedRect;
		}

		function paint() {
			pending = 0;
			if (!frame || !latest) return;
			const rect = readRect();
			if (!rect || !rect.width || !rect.height) return;
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
			frame.style.setProperty('--gaze-x', (2 * x - 1).toFixed(3));
			frame.style.setProperty('--gaze-y', (2 * y - 1).toFixed(3));
		}

		function move(event: PointerEvent) {
			if (event.pointerType === 'touch') return;
			latest = event;
			if (!pending) pending = requestAnimationFrame(paint);
		}

		function reset() {
			if (pending) cancelAnimationFrame(pending);
			pending = 0;
			latest = previous = null;
			pointerRef.current = rest;
			if (!frame) return;
			frame.style.removeProperty('--gaze-x');
			frame.style.removeProperty('--gaze-y');
		}

		const resizeObserver = new ResizeObserver(invalidateRect);
		resizeObserver.observe(frame);
		window.addEventListener('resize', invalidateRect, { passive: true });
		window.addEventListener('scroll', invalidateRect, { passive: true });
		frame.addEventListener('pointerenter', invalidateRect);
		frame.addEventListener('pointermove', move);
		frame.addEventListener('pointerleave', reset);
		frame.addEventListener('pointercancel', reset);

		return () => {
			resizeObserver.disconnect();
			window.removeEventListener('resize', invalidateRect);
			window.removeEventListener('scroll', invalidateRect);
			frame.removeEventListener('pointerenter', invalidateRect);
			frame.removeEventListener('pointermove', move);
			frame.removeEventListener('pointerleave', reset);
			frame.removeEventListener('pointercancel', reset);
			reset();
		};
	}, [enabled, frameRef]);

	return { pointerRef };
}
