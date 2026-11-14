'use client';

import { useEffect, useState } from 'react';

import { playArenaSound } from './arenaSound';
import styles from './arenaCaught.module.css';

const RADIUS = 26;
const LENGTH = 2 * Math.PI * RADIUS;

/**
 * Thinking time for a Challenging student. It only shows the time: when it
 * runs out the lecturer still decides the grade. Mounting it starts the
 * clock, so key it by the question to restart on a new card.
 */
export function ArenaCountdown({ seconds }: { seconds: number }) {
	const [left, setLeft] = useState(seconds);

	useEffect(() => {
		const endsAt = Date.now() + seconds * 1000;
		const timer = window.setInterval(() => {
			const next = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
			setLeft(next);
			if (next === 0) window.clearInterval(timer);
		}, 200);
		return () => window.clearInterval(timer);
	}, [seconds]);

	useEffect(() => {
		if (left === 0) playArenaSound('lock');
		else if (left <= 5) playArenaSound('tick', 5 - left);
	}, [left]);

	const done = left === 0;
	return (
		<div
			className={styles.countdown}
			role="timer"
			aria-label={done ? 'Hết giờ suy nghĩ' : `Còn ${left} giây suy nghĩ`}
			data-low={(left <= 5 && !done) || undefined}
			data-done={done || undefined}
		>
			<svg viewBox="0 0 60 60" aria-hidden="true">
				<circle className={styles.countdownTrack} cx="30" cy="30" r={RADIUS} />
				<circle
					className={styles.countdownArc}
					cx="30"
					cy="30"
					r={RADIUS}
					strokeDasharray={LENGTH}
					strokeDashoffset={LENGTH * (1 - left / seconds)}
				/>
				<text x="30" y="31" textAnchor="middle" dominantBaseline="middle">
					{left}
				</text>
			</svg>
			<span>{done ? 'Hết giờ!' : 'Thời gian suy nghĩ'}</span>
		</div>
	);
}
