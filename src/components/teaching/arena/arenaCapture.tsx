import type { CSSProperties } from 'react';

import styles from './arenaCapture.module.css';

interface Point {
	x: number;
	y: number;
}

export interface CaptureFrame extends Point {
	scale: number;
	lookId: string;
}

/**
 * A quick hunt: the camera cuts between groups and settles just long enough to
 * read the names, holds a beat on the last group, then the claw strikes. The
 * whole capture stays near two seconds for a small class and three for a full one.
 */
export const CAPTURE_MS = {
	entry: 620,
	pan: 560,
	camera: 340,
	anticipate: 460,
	grab: 680,
	reset: 280,
};
/** The claw closes on the sprite at this fraction of the grab animation. */
export const CAPTURE_CONTACT = 0.58;

export function captureTimeline(frameCount: number) {
	const scanEnd = frameCount ? CAPTURE_MS.entry + Math.max(0, frameCount - 1) * CAPTURE_MS.pan : 0;
	const reach = scanEnd + CAPTURE_MS.anticipate;
	return {
		scanEnd,
		reach,
		contact: reach + Math.round(CAPTURE_MS.grab * CAPTURE_CONTACT),
		retreat: reach + CAPTURE_MS.grab,
		open: reach + CAPTURE_MS.grab + CAPTURE_MS.reset,
	};
}

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

/** Frame actual neighbors on the floor, allowing the route to end at the drawn student. */
export function captureRoute(world: HTMLElement | null, picked: string): CaptureFrame[] {
	const floor = world?.querySelector<HTMLElement>('[data-arena-crowd]');
	if (!floor?.clientWidth || !floor.clientHeight) return [];
	const width = floor.clientWidth;
	const height = floor.clientHeight;
	const players = Array.from(floor.querySelectorAll<HTMLElement>('[data-player-id]'), (player) => ({
		x: player.offsetLeft,
		y: player.offsetTop,
		id: player.dataset.playerId!,
	}));
	const target = players.find(({ id }) => id === picked);
	if (!target) return [];

	// Names are already large on the floor: a modest push-in keeps neighbours apart.
	const scale = width < 620 ? 1.45 : 1.6;
	const frameAt = (point: (typeof players)[number], neighbors: number): CaptureFrame => {
		const group = players
			.toSorted((a, b) => distance(a, point) - distance(b, point))
			.slice(0, neighbors);
		const center = group.reduce(
			(sum, player) => ({ x: sum.x + player.x / group.length, y: sum.y + player.y / group.length }),
			{ x: 0, y: 0 },
		);
		const translation = (focus: number, span: number) =>
			Math.min(0, Math.max(span * (1 - scale), span / 2 - focus * scale));
		// Give the named student more room in the last shot while retaining their neighbors.
		return {
			x: translation(point.x * 0.65 + center.x * 0.35, width),
			y: translation(point.y * 0.65 + center.y * 0.35, height),
			scale,
			lookId: point.id,
		};
	};

	const final = frameAt(target, 4);
	if (players.length < 3) return [final];
	const frames = players.map((player) => frameAt(player, 5));
	const apart = Math.min(width, height) * 0.4;
	const first = frames.toSorted((a, b) => distance(b, final) - distance(a, final))[0]!;
	if (distance(first, final) < apart) return [final];
	const midpoint = { x: (first.x + final.x) / 2, y: (first.y + final.y) / 2 };
	const middle = frames
		.filter((frame) => distance(frame, first) >= apart && distance(frame, final) >= apart)
		.toSorted((a, b) => distance(a, midpoint) - distance(b, midpoint))[0];
	return middle && players.length >= 10 ? [first, middle, final] : [first, final];
}

export interface CaptureHandCue {
	from: Point;
	to: Point;
}

export function CaptureHand({ from, to }: CaptureHandCue) {
	const angle = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI - 90;
	return (
		<div
			className={styles.hand}
			style={
				{
					'--hand-x': `${from.x}px`,
					'--hand-y': `${from.y}px`,
					'--grip-x': `${to.x}px`,
					'--grip-y': `${to.y}px`,
					'--hand-angle': `${angle}deg`,
					'--grab-ms': `${CAPTURE_MS.grab}ms`,
				} as CSSProperties
			}
		>
			<svg viewBox="0 0 120 140" className={styles.claw} aria-hidden="true">
				<path
					d="M42 4 C48 20 28 35 26 60 C24 81 38 94 58 95 C84 96 98 80 94 59 C91 43 74 25 79 4 C66 14 55 17 42 4Z"
					className={styles.palm}
				/>
				<path d="M42 32 C33 46 28 58 31 69 C37 57 47 50 54 43" className={styles.palmLight} />
				<g className={styles.leftClaw}>
					<path d="M35 59 C17 64 7 76 12 93 C15 105 23 112 31 116 C31 108 25 99 30 89 L46 76" />
					<path d="M24 104 Q24 114 31 116 L31 106Z" className={styles.tip} />
				</g>
				<g className={styles.rightClaw}>
					<path d="M78 53 C101 56 114 70 108 91 C104 104 96 110 88 112 C92 100 97 91 91 83 L74 76" />
					<path d="M88 112 Q96 108 99 101 L91 103Z" className={styles.tip} />
				</g>
				<g className={styles.fingers}>
					<path d="M44 69 C37 84 33 106 45 124 C50 130 53 133 58 134 C54 123 51 117 53 104 L61 80" />
					<path d="M66 72 C62 89 58 107 71 122 C75 127 80 129 85 129 C79 119 76 111 78 100 L83 76" />
					<path d="M50 130 L58 134 L55 124Z M77 126 L85 129 L81 121Z" className={styles.tip} />
				</g>
			</svg>
		</div>
	);
}
