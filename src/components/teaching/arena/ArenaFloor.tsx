'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

import { useMotionTier } from '@/components/motion';

import type { RecallArenaPlayer } from '@/features/teaching/types';

import { suckStyle, type ArenaSuck } from './ArenaEffects';
import { ArenaCharacter } from './ArenaCharacter';
import { arenaCharacterFor } from './arenaCharacters';
import { floorLayout, nextRoamingSpot, startingSpots, type RoamingSpot } from './arenaRoaming';
import { STRIKE_HERO_SCALE } from './arenaStrikes';
import styles from './arena.module.css';

export interface ArenaAttackCue {
	enrollmentId: string;
	sequence: number;
	/** The boss is to the hero's left. */
	facingLeft: boolean;
}

/**
 * The crowd: students roam between points across the whole floor, with room
 * around other students' paths so their names remain readable.
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
	const floorRef = useRef<HTMLDivElement>(null);
	const [floorWidth, setFloorWidth] = useState(0);
	const count = players.length;
	const { cols } = floorLayout(count);
	const initial = useMemo(() => startingSpots(players), [players]);
	const [wander, setWander] = useState(initial);
	const rosterMatches =
		wander.size === count && players.every((player) => wander.has(player.enrollmentId));
	const spots = rosterMatches ? wander : initial;
	const paused = hunting || Boolean(caughtId) || Boolean(suck) || Boolean(attackCue);
	const fullSize = count <= 24 ? 82 : count <= 40 ? 70 : 62;
	const size = floorWidth
		? Math.max(26, Math.min(fullSize, Math.floor((floorWidth / cols) * 0.72)))
		: fullSize;

	useLayoutEffect(() => {
		const floor = floorRef.current;
		if (!floor || typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(([entry]) => {
			if (entry) setFloorWidth(Math.round(entry.contentRect.width));
		});
		observer.observe(floor);
		return () => observer.disconnect();
	}, []);

	// Capture the visible position before a grab or strike. The next render starts
	// from that point instead of snapping to the end of a walking transition.
	useLayoutEffect(() => {
		if ((!paused && !reducedMotion) || !floorRef.current) return;
		const floor = floorRef.current.getBoundingClientRect();
		if (!floor.width || !floor.height) return;
		setWander((previous) => {
			const frozen = new Map(previous);
			floorRef.current?.querySelectorAll<HTMLElement>('[data-player-id]').forEach((element) => {
				const id = element.dataset.playerId;
				const spot = id ? frozen.get(id) : undefined;
				if (!id || !spot) return;
				const rect = element.getBoundingClientRect();
				const point = {
					x: ((rect.left + rect.width / 2 - floor.left) / floor.width) * 100,
					y: ((rect.top + rect.height / 2 - floor.top) / floor.height) * 100,
				};
				frozen.set(id, {
					...spot,
					...point,
					from: point,
					walking: false,
					travelMs: 0,
					nextAt: performance.now() + 900,
				});
			});
			return frozen;
		});
	}, [paused, reducedMotion]);

	useEffect(() => {
		if (reducedMotion || paused || count === 0) return;
		const timer = window.setInterval(() => {
			const floor = floorRef.current?.getBoundingClientRect();
			if (!floor?.width || !floor.height) return;
			const now = performance.now();
			setWander((previous) => {
				const source =
					previous.size === count && players.every((player) => previous.has(player.enrollmentId))
						? previous
						: initial;
				const next = new Map(source);
				let changed = false;
				for (const player of players) {
					const spot = next.get(player.enrollmentId);
					if (!spot || now < spot.nextAt) continue;
					next.set(
						player.enrollmentId,
						nextRoamingSpot(spot, next.values(), floor.width, floor.height, size, now),
					);
					changed = true;
				}
				return changed ? next : previous;
			});
		}, 450);
		return () => window.clearInterval(timer);
	}, [players, initial, count, size, reducedMotion, paused]);

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
			ref={floorRef}
			className={styles.floor}
			data-hunting={hunting || undefined}
			data-striking={(attackCue && !reducedMotion) || undefined}
			style={{ '--strike-hero-scale': STRIKE_HERO_SCALE } as CSSProperties}
		>
			{players.map((player, index) => {
				const spot: RoamingSpot =
					spots.get(player.enrollmentId) ?? initial.get(player.enrollmentId)!;
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
						data-walking={(spot.walking && !paused && !reducedMotion) || undefined}
						data-suck={suck?.id === player.enrollmentId ? suck.stage : undefined}
						data-testid="arena-player"
						style={
							{
								width: `${size + 72}px`,
								left: `${spot.x}%`,
								top: `${spot.y}%`,
								'--travel-ms': `${spot.travelMs}ms`,
								animationDelay: `${(index % 7) * -0.23}s`,
								...suckStyle(suck, player.enrollmentId),
							} as CSSProperties
						}
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
								walking={spot.walking && !paused && !reducedMotion}
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
