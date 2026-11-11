'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';

import { useMotionTier } from '@/components/motion';

import type { RecallArenaPlayer } from '@/features/teaching/types';

import { suckStyle, type ArenaSuck } from './ArenaEffects';
import { ArenaCharacter } from './ArenaCharacter';
import { arenaCharacterFor } from './arenaCharacters';
import { STRIKE_HERO_SCALE } from './arenaStrikes';
import styles from './arena.module.css';

interface Spot {
	x: number;
	y: number;
	/** Wander offset inside the student's own cell, in percent of the floor. */
	dx: number;
	dy: number;
	facingLeft: boolean;
	walking: boolean;
}

export interface ArenaAttackCue {
	enrollmentId: string;
	sequence: number;
	/** The boss is to the hero's left. */
	facingLeft: boolean;
}

function layout(count: number) {
	const cols = Math.max(1, Math.ceil(Math.sqrt(count * 4)));
	const rows = Math.max(1, Math.ceil(count / cols));
	return { cols, rows };
}

function baseSpots(count: number): Spot[] {
	const { cols, rows } = layout(count);
	return Array.from({ length: count }, (_, index) => {
		const row = Math.floor(index / cols);
		const col = index % cols;
		// A short last row sits in the middle instead of hugging the left wall.
		const inRow = row === rows - 1 ? count - cols * (rows - 1) : cols;
		const centred = inRow < cols ? (cols - inRow) / 2 : row % 2 === 1 ? 0.25 : 0;
		return {
			x: Math.min(97, ((col + 0.5 + centred) / cols) * 100),
			y: ((row + 0.55) / rows) * 100,
			dx: 0,
			dy: 0,
			facingLeft: false,
			walking: false,
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
	attackCue,
	heroIds,
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
	attackCue: ArenaAttackCue | null;
	/** Heroes the lecturer put in play; empty means all of them. */
	heroIds: readonly string[];
}) {
	const { reduced: reducedMotion } = useMotionTier();
	const count = players.length;
	const { cols, rows } = layout(count);
	const base = useMemo(() => baseSpots(count), [count]);
	const [wander, setWander] = useState<Spot[]>(base);
	// A new head count re-lays out the floor; until the next wander tick use the fresh layout.
	const spots = wander.length === count ? wander : base;

	useEffect(() => {
		if (reducedMotion || hunting || caughtId || attackCue || count === 0) return;
		const cellW = 100 / cols;
		const cellH = 100 / rows;
		const timer = window.setInterval(() => {
			setWander((previous) =>
				(previous.length === count ? previous : baseSpots(count)).map((spot) => {
					if (Math.random() > 0.4) return { ...spot, walking: false };
					const dx = (Math.random() - 0.5) * cellW * 0.18;
					const dy = (Math.random() - 0.5) * cellH * 0.18;
					return { ...spot, dx, dy, facingLeft: dx < spot.dx, walking: true };
				}),
			);
		}, 1800);
		return () => window.clearInterval(timer);
	}, [count, cols, rows, reducedMotion, hunting, caughtId, attackCue]);

	const size = count <= 24 ? 82 : count <= 40 ? 70 : 62;
	const characters = useMemo(
		() =>
			new Map(
				players.map((player) => [
					player.enrollmentId,
					arenaCharacterFor(player.studentCode, heroIds),
				]),
			),
		[players, heroIds],
	);

	return (
		<div
			className={styles.floor}
			data-hunting={hunting || undefined}
			data-striking={(attackCue && !reducedMotion) || undefined}
			style={{ '--strike-hero-scale': STRIKE_HERO_SCALE } as CSSProperties}
		>
			{players.map((player, index) => {
				const spot = spots[index] ?? base[index]!;
				const highlighted = highlightId === player.enrollmentId;
				const caught = caughtId === player.enrollmentId;
				const attacking = attackCue?.enrollmentId === player.enrollmentId;
				return (
					<div
						key={player.enrollmentId}
						className={styles.player}
						data-highlight={highlighted || undefined}
						data-caught={caught || undefined}
						data-called={calledIds.has(player.enrollmentId) || undefined}
						data-attacking={(attacking && !reducedMotion) || undefined}
						data-player-id={player.enrollmentId}
						data-suck={suck?.id === player.enrollmentId ? suck.stage : undefined}
						data-testid="arena-player"
						style={{
							width: `${100 / cols}%`,
							left: `${spot.x + spot.dx}%`,
							top: `${spot.y + spot.dy}%`,
							animationDelay: `${(index % 7) * -0.23}s`,
							...suckStyle(suck, player.enrollmentId),
						}}
					>
						<span
							className={styles.playerFigure}
							style={
								{ '--hero-accent': characters.get(player.enrollmentId)!.accent } as CSSProperties
							}
						>
							<ArenaCharacter
								character={characters.get(player.enrollmentId)!}
								size={size}
								walking={
									spot.walking && !hunting && !caught && !suck && !attackCue && !reducedMotion
								}
								attacking={attacking && !reducedMotion}
								facingLeft={attacking ? attackCue.facingLeft : spot.facingLeft}
							/>
						</span>
						<span
							className={styles.playerName}
							title={names.get(player.enrollmentId) ?? player.givenName}
						>
							{names.get(player.enrollmentId) ?? player.givenName}
						</span>
					</div>
				);
			})}
		</div>
	);
}
