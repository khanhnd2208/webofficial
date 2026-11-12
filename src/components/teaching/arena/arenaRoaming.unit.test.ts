import { describe, expect, it } from 'vitest';

import type { RecallArenaPlayer } from '@/features/teaching/types';

import { currentPoint, nextRoamingSpot, startingSpots } from './arenaRoaming';

const players = [
	{ enrollmentId: 'a', studentCode: 'SV-a', givenName: 'An' },
	{ enrollmentId: 'b', studentCode: 'SV-b', givenName: 'Bình' },
] as RecallArenaPlayer[];

describe('Arena roaming', () => {
	it('moves beyond a starting cell and keeps travel speed in step with the walk animation', () => {
		const spots = startingSpots(players);
		const start = spots.get('a')!;
		const ready = { ...start, nextAt: 1 };
		const next = nextRoamingSpot(ready, [ready, spots.get('b')!], 1200, 400, 82, 1000, () => 0.4);
		expect(next.walking).toBe(true);
		expect(Math.abs(next.x - start.x)).toBeGreaterThan(5);
		expect(next.travelMs).toBeGreaterThan(500);
		expect(currentPoint(next, 1000 + next.travelMs / 2).x).toBeCloseTo((start.x + next.x) / 2);
	});

	it('keeps each route inside the visible floor', () => {
		const start = { ...startingSpots(players).get('a')!, nextAt: 1 };
		const next = nextRoamingSpot(start, [start], 350, 250, 82, 1000, () => 0);
		expect(next.walking).toBe(true);
		expect(next.x).toBeGreaterThanOrEqual(((82 / 2 + 12) / 350) * 100);
		expect(next.y).toBeGreaterThanOrEqual(((82 / 2 + 20) / 250) * 100);
	});

	it('does not route through a neighbor', () => {
		const start = { ...startingSpots(players).get('a')!, nextAt: 1 };
		const neighbor = { ...start, x: start.x + 8, from: { x: start.x + 8, y: start.y } };
		let index = 0;
		const next = nextRoamingSpot(
			start,
			new Map([
				['a', start],
				['b', neighbor],
			]).values(),
			1200,
			400,
			82,
			1000,
			() => (index++ === 0 ? 0.4 : index % 2 === 0 ? 0 : 0.5),
		);
		expect(next.walking).toBe(false);
	});

	it('lets a full class spread across the floor over time', () => {
		const classPlayers = Array.from({ length: 40 }, (_, index) => ({
			enrollmentId: `${index}`,
			studentCode: `SV-${index}`,
			givenName: `Student ${index}`,
		})) as RecallArenaPlayer[];
		const initial = startingSpots(classPlayers);
		const spots = new Map(initial);
		let seed = 17;
		const random = () => {
			seed = (seed * 16807) % 2147483647;
			return seed / 2147483647;
		};
		for (let now = 450; now <= 18_000; now += 450) {
			for (const player of classPlayers) {
				const spot = spots.get(player.enrollmentId)!;
				if (now < spot.nextAt) continue;
				spots.set(
					player.enrollmentId,
					nextRoamingSpot(spot, spots.values(), 1200, 400, 70, now, random),
				);
			}
		}
		const moved = classPlayers.filter((player) => {
			const before = initial.get(player.enrollmentId)!;
			const after = spots.get(player.enrollmentId)!;
			return Math.hypot(after.x - before.x, after.y - before.y) > 5;
		});
		expect(moved.length).toBeGreaterThan(25);
	});
});
