'use client';

import { useEffect, useMemo, useState } from 'react';

import { useMotionTier } from '@/components/motion';

import type { RecallArenaPlayer } from '@/features/teaching/types';

import { suckStyle, type ArenaSuck } from './ArenaEffects';
import { ArenaAvatar } from './ArenaFigures';
import { avatarLook } from './arenaGame';
import styles from './arena.module.css';

interface Spot {
	x: number;
	y: number;
	/** Wander offset inside the student's own cell, in percent of the floor. */
	dx: number;
	dy: number;
	facingLeft: boolean;
}

function layout(count: number) {
	const cols = Math.max(1, Math.ceil(Math.sqrt(count * 2.6)));
	const rows = Math.max(1, Math.ceil(count / cols));
	return { cols, rows };
}

function baseSpots(count: number): Spot[] {
	const { cols, rows } = layout(count);
	return Array.from({ length: count }, (_, index) => {
		const row = Math.floor(index / cols);
		const col = index % cols;
		const stagger = row % 2 === 1 ? 0.5 : 0;
		return {
			x: Math.min(97, ((col + 0.5 + stagger * 0.5) / cols) * 100),
			y: ((row + 0.55) / rows) * 100,
			dx: 0,
			dy: 0,
			facingLeft: false,
		};
	});
}

/**
 * The crowd: one figure per student in the room, each wandering inside its
 * own cell so nobody overlaps and names stay readable from the back row.
 */
export function ArenaFloor({
	players,
	highlightId,
	caughtId,
	hunting,
	calledIds,
	names,
	suck,
}: {
	players: RecallArenaPlayer[];
	highlightId: string | null;
	caughtId: string | null;
	hunting: boolean;
	calledIds: ReadonlySet<string>;
	/** Label per enrollment, already made unique for this room. */
	names: ReadonlyMap<string, string>;
	/** The grab in progress, if any: reticle, flight into the mouth, landing. */
	suck: ArenaSuck | null;
}) {
	const { reduced: reducedMotion } = useMotionTier();
	const count = players.length;
	const { cols, rows } = layout(count);
	const base = useMemo(() => baseSpots(count), [count]);
	const [wander, setWander] = useState<Spot[]>(base);
	// A new head count re-lays out the floor; until the next wander tick use the fresh layout.
	const spots = wander.length === count ? wander : base;

	useEffect(() => {
		if (reducedMotion || count === 0) return;
		const cellW = 100 / cols;
		const cellH = 100 / rows;
		const timer = window.setInterval(() => {
			setWander((previous) =>
				(previous.length === count ? previous : baseSpots(count)).map((spot) => {
					if (Math.random() > 0.4) return spot;
					const dx = (Math.random() - 0.5) * cellW * 0.55;
					const dy = (Math.random() - 0.5) * cellH * 0.35;
					return { ...spot, dx, dy, facingLeft: dx < spot.dx };
				}),
			);
		}, 1800);
		return () => window.clearInterval(timer);
	}, [count, cols, rows, reducedMotion]);

	const size = count <= 24 ? 68 : count <= 40 ? 58 : 50;
	const looks = useMemo(
		() => new Map(players.map((player) => [player.enrollmentId, avatarLook(player.studentCode)])),
		[players],
	);

	return (
		<div className={styles.floor} data-hunting={hunting || undefined}>
			{players.map((player, index) => {
				const spot = spots[index] ?? base[index]!;
				const highlighted = highlightId === player.enrollmentId;
				const caught = caughtId === player.enrollmentId;
				return (
					<div
						key={player.enrollmentId}
						className={styles.player}
						data-highlight={highlighted || undefined}
						data-caught={caught || undefined}
						data-called={calledIds.has(player.enrollmentId) || undefined}
						data-player-id={player.enrollmentId}
						data-suck={suck?.id === player.enrollmentId ? suck.stage : undefined}
						data-testid="arena-player"
						style={{
							left: `${spot.x + spot.dx}%`,
							top: `${spot.y + spot.dy}%`,
							animationDelay: `${(index % 7) * -0.23}s`,
							...suckStyle(suck, player.enrollmentId),
						}}
					>
						<span className={styles.playerFigure} data-facing-left={spot.facingLeft || undefined}>
							<ArenaAvatar look={looks.get(player.enrollmentId)!} size={size} />
						</span>
						<span className={styles.playerName}>
							{names.get(player.enrollmentId) ?? player.givenName}
						</span>
					</div>
				);
			})}
		</div>
	);
}
