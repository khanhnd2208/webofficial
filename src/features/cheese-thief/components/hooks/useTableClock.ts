'use client';

import { useEffect, useState } from 'react';

/**
 * Server time, ticking once a second. Every phone corrects for its own clock with the
 * `serverNow` of the last poll, so a countdown reads the same all round the table.
 */
export function useTableClock(serverNow: string, fetchedAt: number): number {
	const skew = new Date(serverNow).getTime() - fetchedAt;
	const [now, setNow] = useState(() => Date.now() + skew);

	useEffect(() => {
		const tick = () => setNow(Date.now() + skew);
		tick();
		const timer = window.setInterval(tick, 1000);
		return () => window.clearInterval(timer);
	}, [skew]);

	return now;
}

export function formatClock(totalSeconds: number): string {
	const seconds = Math.max(0, Math.floor(totalSeconds));
	return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
