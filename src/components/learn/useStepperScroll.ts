'use client';

import { useEffect, useRef, type RefObject } from 'react';

/** Scrolls the stepper back to its top after a step change, and only when that top is off screen. */
export function useStepperScroll(
	rootRef: RefObject<HTMLElement | null>,
	token: number | string,
	ready: boolean,
) {
	const skip = useRef(true);

	useEffect(() => {
		if (!ready) return;
		if (skip.current) {
			skip.current = false;
			return;
		}
		const el = rootRef.current;
		if (!el) return;
		const top = el.getBoundingClientRect().top;
		if (top >= 0 && top < window.innerHeight) return;
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		el.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
	}, [token, ready, rootRef]);
}
