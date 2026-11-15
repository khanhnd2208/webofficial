import { afterEach, describe, expect, it } from 'vitest';

import { captureRoute } from './arenaCapture';

function arenaFloor(points: Array<{ id: string; x: number; y: number }>) {
	const world = document.createElement('div');
	const crowd = document.createElement('div');
	crowd.dataset.arenaCrowd = '';
	Object.defineProperties(crowd, {
		clientWidth: { configurable: true, value: 1000 },
		clientHeight: { configurable: true, value: 400 },
	});
	for (const point of points) {
		const player = document.createElement('div');
		player.dataset.playerId = point.id;
		Object.defineProperties(player, {
			offsetLeft: { configurable: true, value: point.x },
			offsetTop: { configurable: true, value: point.y },
		});
		crowd.append(player);
	}
	world.append(crowd);
	document.body.append(world);
	return world;
}

describe('Arena boss capture route', () => {
	afterEach(() => document.body.replaceChildren());

	it('uses one readable close-up for a small class and ends on the drawn student', () => {
		const world = arenaFloor([
			{ id: 'an', x: 180, y: 120 },
			{ id: 'binh', x: 500, y: 210 },
		]);

		const route = captureRoute(world, 'binh');

		expect(route).toHaveLength(1);
		expect(route[0]).toMatchObject({ lookId: 'binh', scale: 1.95 });
	});

	it('scans distinct floor groups before ending with the drawn student in a crowded class', () => {
		const world = arenaFloor(
			Array.from({ length: 12 }, (_, index) => ({
				id: `student-${index}`,
				x: 80 + (index % 4) * 280,
				y: 70 + Math.floor(index / 4) * 130,
			})),
		);

		const route = captureRoute(world, 'student-11');

		expect(route.length).toBeGreaterThanOrEqual(2);
		expect(route.at(-1)?.lookId).toBe('student-11');
		expect(route[0]?.lookId).not.toBe('student-11');
		expect(
			Math.hypot(route[0]!.x - route.at(-1)!.x, route[0]!.y - route.at(-1)!.y),
		).toBeGreaterThan(160);
	});

	it('falls back cleanly when the floor has not been laid out or the student is absent', () => {
		const world = document.createElement('div');
		const crowd = document.createElement('div');
		crowd.dataset.arenaCrowd = '';
		world.append(crowd);

		expect(captureRoute(world, 'missing')).toEqual([]);
		expect(captureRoute(null, 'missing')).toEqual([]);
	});
});
