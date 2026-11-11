import type { RecallArenaPlayer } from '@/features/teaching/types';

export interface Point {
	x: number;
	y: number;
}

export interface RoamingSpot extends Point {
	from: Point;
	startedAt: number;
	travelMs: number;
	nextAt: number;
	facingLeft: boolean;
	walking: boolean;
}

export function floorLayout(count: number) {
	const cols = Math.max(1, Math.ceil(Math.sqrt(count * 2.2)));
	const rows = Math.max(1, Math.ceil(count / cols));
	return { cols, rows };
}

export function startingSpots(players: RecallArenaPlayer[]): Map<string, RoamingSpot> {
	const { cols, rows } = floorLayout(players.length);
	return new Map(
		players.map((player, index) => {
			const row = Math.floor(index / cols);
			const col = index % cols;
			const inRow = Math.min(cols, players.length - row * cols);
			const point = { x: ((col + 0.5) / inRow) * 100, y: ((row + 0.5) / rows) * 100 };
			return [
				player.enrollmentId,
				{
					...point,
					from: point,
					startedAt: 0,
					travelMs: 0,
					nextAt: 0,
					facingLeft: index % 2 === 0,
					walking: false,
				},
			];
		}),
	);
}

export function currentPoint(spot: RoamingSpot, now: number): Point {
	if (!spot.walking || !spot.travelMs) return { x: spot.x, y: spot.y };
	const fraction = Math.max(0, Math.min(1, (now - spot.startedAt) / spot.travelMs));
	return {
		x: spot.from.x + (spot.x - spot.from.x) * fraction,
		y: spot.from.y + (spot.y - spot.from.y) * fraction,
	};
}

function distanceToPath(point: Point, from: Point, to: Point, width: number, height: number) {
	const vx = ((to.x - from.x) * width) / 100;
	const vy = ((to.y - from.y) * height) / 100;
	const px = ((point.x - from.x) * width) / 100;
	const py = ((point.y - from.y) * height) / 100;
	const fraction = Math.max(0, Math.min(1, (px * vx + py * vy) / (vx * vx + vy * vy || 1)));
	return Math.hypot(px - fraction * vx, py - fraction * vy);
}

function pathsCross(a: Point, b: Point, c: Point, d: Point) {
	const side = (p: Point, q: Point, r: Point) =>
		(q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
	return side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0;
}

/** Choose a short route anywhere on the floor, rather than inside the starting cell. */
export function nextRoamingSpot(
	spot: RoamingSpot,
	others: Iterable<RoamingSpot>,
	width: number,
	height: number,
	size: number,
	now: number,
	random: () => number = Math.random,
): RoamingSpot {
	if (spot.nextAt === 0) return { ...spot, nextAt: now + 600 + random() * 2200 };
	if (spot.walking) return { ...spot, walking: false, nextAt: now + 550 + random() * 1500 };
	if (random() > 0.78) return { ...spot, nextAt: now + 800 + random() * 1200 };

	const peers = Array.from(others);
	const { cols, rows } = floorLayout(peers.length);
	const edgeX = Math.min(49, ((size / 2 + 12) / width) * 100);
	const edgeY = Math.min(49, ((size / 2 + 20) / height) * 100);
	const clearance = Math.min(size * 0.8, (width / cols) * 0.68, (height / rows) * 0.68);
	const from = { x: spot.x, y: spot.y };
	for (let attempt = 0; attempt < 12; attempt += 1) {
		const angle = random() * Math.PI * 2;
		const distance = Math.max(size * 0.75, Math.min(45 + random() * 130, width * 0.25));
		const to = {
			x: Math.max(
				edgeX,
				Math.min(100 - edgeX, from.x + (Math.cos(angle) * distance * 100) / width),
			),
			y: Math.max(
				edgeY,
				Math.min(100 - edgeY, from.y + (Math.sin(angle) * distance * 100) / height),
			),
		};
		const actual = Math.hypot(((to.x - from.x) * width) / 100, ((to.y - from.y) * height) / 100);
		if (actual < Math.min(40, size * 0.65)) continue;
		const clear = peers.every((other) => {
			if (other === spot) return true;
			const current = currentPoint(other, now);
			return (
				distanceToPath(current, from, to, width, height) > clearance &&
				distanceToPath({ x: other.x, y: other.y }, from, to, width, height) > clearance &&
				(!other.walking ||
					(distanceToPath(to, current, other, width, height) > clearance &&
						!pathsCross(from, to, current, other)))
			);
		});
		if (!clear) continue;
		const travelMs = Math.round((actual / (65 + random() * 30)) * 1000);
		return {
			...spot,
			...to,
			from,
			startedAt: now,
			travelMs,
			nextAt: now + travelMs,
			facingLeft: to.x < from.x,
			walking: true,
		};
	}
	return { ...spot, nextAt: now + 700 + random() * 1200 };
}
