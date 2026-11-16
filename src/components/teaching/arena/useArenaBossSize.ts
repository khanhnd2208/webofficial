'use client';

import { useEffect, useState } from 'react';

/** The boss before the page is measured, and in tests. */
export const ARENA_BOSS_SIZE = 240;

/**
 * Width of the boss on the stage. It follows the screen, so on a projector the
 * boss fills the top of the room while a phone keeps space for the floor.
 */
export function arenaBossSize(width: number, height: number) {
	return Math.round(Math.max(170, Math.min(420, height * 0.36, width * 0.46)));
}

export function useArenaBossSize() {
	const [size, setSize] = useState(ARENA_BOSS_SIZE);
	useEffect(() => {
		const measure = () => setSize(arenaBossSize(window.innerWidth, window.innerHeight));
		measure();
		window.addEventListener('resize', measure);
		return () => window.removeEventListener('resize', measure);
	}, []);
	return size;
}
