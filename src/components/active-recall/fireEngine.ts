/**
 * Canvas fire that burns around the edges of the Active Recall card.
 *
 * Flames come from three emitters: a bed under the card and two side walls.
 * The card sits above the canvas, so flames show only in the margin around it
 * and never cover the text. Each flame particle cools from yellow to deep red
 * as it rises; embers are long-lived sparks that drift above the card.
 */

type Flame = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	life: number;
	maxLife: number;
	size: number;
	side: -1 | 0 | 1;
	seed: number;
};

type Ember = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	life: number;
	maxLife: number;
	size: number;
	seed: number;
};

type CardBox = { left: number; top: number; right: number; bottom: number };

export type FireEngine = {
	flare: () => void;
	destroy: () => void;
};

const SPRITE_STEPS = 24;
const SPRITE_PX = 64;
const MAX_FLAMES = 1400;
const MAX_EMBERS = 60;
const BASE_INTENSITY = 0.6;
const WALL_SPAN_MAX = 420;
const COMPACT_GUTTER_PX = 36;

// Temperature ramp, hottest first: core, flame body, tip, dying red.
const RAMP: Array<[number, [number, number, number], number]> = [
	[0, [255, 214, 104], 0.95],
	[0.14, [255, 168, 44], 0.92],
	[0.32, [250, 110, 18], 0.85],
	[0.55, [214, 56, 12], 0.65],
	[0.8, [140, 26, 10], 0.3],
	[1, [70, 14, 6], 0],
];

function rampAt(t: number) {
	for (let index = 1; index < RAMP.length; index += 1) {
		const [stop, rgb, alpha] = RAMP[index]!;
		const [prevStop, prevRgb, prevAlpha] = RAMP[index - 1]!;
		if (t <= stop) {
			const k = (t - prevStop) / (stop - prevStop);
			const mix = (a: number, b: number) => Math.round(a + (b - a) * k);
			return {
				rgb: [mix(prevRgb[0], rgb[0]), mix(prevRgb[1], rgb[1]), mix(prevRgb[2], rgb[2])],
				alpha: prevAlpha + (alpha - prevAlpha) * k,
			};
		}
	}
	return { rgb: RAMP[RAMP.length - 1]![1], alpha: 0 };
}

function makeSprites() {
	const sprites: HTMLCanvasElement[] = [];
	for (let step = 0; step < SPRITE_STEPS; step += 1) {
		const sprite = document.createElement('canvas');
		sprite.width = SPRITE_PX;
		sprite.height = SPRITE_PX;
		const ctx = sprite.getContext('2d');
		if (!ctx) continue;
		const { rgb, alpha } = rampAt(step / (SPRITE_STEPS - 1));
		const [r, g, b] = rgb;
		const half = SPRITE_PX / 2;
		const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
		gradient.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
		gradient.addColorStop(0.35, `rgba(${r},${g},${b},${alpha * 0.55})`);
		gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, SPRITE_PX, SPRITE_PX);
		sprites.push(sprite);
	}
	return sprites;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

export function createFireEngine(canvas: HTMLCanvasElement, card: HTMLElement): FireEngine {
	const ctx = canvas.getContext('2d');
	if (!ctx) return { flare: () => {}, destroy: () => {} };

	const sprites = makeSprites();
	const flames: Flame[] = [];
	const embers: Ember[] = [];
	let box: CardBox = { left: 0, top: 0, right: 0, bottom: 0 };
	let width = 0;
	let height = 0;
	let intensity = 0;
	let target = BASE_INTENSITY;
	let flareBoost = 0;
	let frame = 0;
	let last = 0;
	let visible = true;
	let clock = 0;
	// Phones leave only a thin gutter beside the card: burn as small licks
	// hugging the edge instead of a full wall that the screen edge cuts flat.
	let compact = false;

	const measure = () => {
		const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
		const canvasRect = canvas.getBoundingClientRect();
		const cardRect = card.getBoundingClientRect();
		width = canvasRect.width;
		height = canvasRect.height;
		canvas.width = Math.max(1, Math.round(width * dpr));
		canvas.height = Math.max(1, Math.round(height * dpr));
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		box = {
			left: cardRect.left - canvasRect.left,
			top: cardRect.top - canvasRect.top,
			right: cardRect.right - canvasRect.left,
			bottom: cardRect.bottom - canvasRect.top,
		};
		compact = box.left < COMPACT_GUTTER_PX;
	};

	// About one hot spot per 140px of edge.
	const compactSpots = () => Math.max(3, Math.round((box.bottom - box.top) / 140));

	const spawnFlame = (side: -1 | 0 | 1) => {
		if (flames.length >= MAX_FLAMES) return;
		// Tall cards (phones, long answers) burn on the lower part only.
		const cardHeight = Math.min(box.bottom - box.top, WALL_SPAN_MAX);
		const margin = side === -1 ? box.left : side === 1 ? width - box.right : height - box.bottom;
		let x: number;
		let y: number;
		let size: number;
		if (side === 0) {
			x = rand(box.left - margin * 0.3, box.right + margin * 0.3);
			y = box.bottom + rand(margin * 0.25, Math.max(6, margin * 0.85));
			size = compact ? rand(14, 26) : rand(26, 46);
		} else if (compact) {
			// Spread along the whole edge; the bottom of a tall card is often
			// under the sticky controls on a phone.
			// Flames gather at a few slow-drifting hot spots, so they read as
			// separate tongues with gaps instead of one continuous band.
			const span = box.bottom - box.top;
			const spots = compactSpots();
			const spot = Math.floor(Math.random() * spots);
			const phase = spot * 2.4 + (side === 1 ? 1.3 : 0);
			const anchor = (spot + 0.5) / spots + (Math.sin(clock * 0.004 + phase) * 0.4) / spots;
			x = side === -1 ? box.left - rand(0, margin * 0.35) : box.right + rand(0, margin * 0.35);
			y = box.top + anchor * span + rand(-8, 8);
			size = rand(13, 22) * (0.55 + 0.45 * Math.sin(clock * 0.02 + phase) ** 2);
		} else {
			// Weighted toward the bottom so the walls taper like real flames.
			const rise = Math.pow(Math.random(), 2.2) * cardHeight * 0.7;
			x = side === -1 ? box.left - rand(2, margin * 0.5) : box.right + rand(2, margin * 0.5);
			y = box.bottom + rand(0, 10) - rise;
			size = rand(20, 38) * (1 - (rise / cardHeight) * 0.7);
		}
		flames.push({
			x,
			y,
			vx: side * (compact ? rand(0, 0.08) : rand(0.02, 0.2)),
			vy: compact ? rand(-1.1, -0.4) : rand(-1.5, -0.6),
			life: 0,
			maxLife: compact ? rand(16, 28) : rand(30, 54),
			size: size * (0.85 + intensity * 0.25),
			side,
			seed: Math.random() * 1000,
		});
	};

	const spawnEmber = () => {
		if (embers.length >= MAX_EMBERS) return;
		const onSide = Math.random() < 0.6;
		const side = Math.random() < 0.5 ? -1 : 1;
		embers.push({
			x: onSide
				? side === -1
					? box.left - rand(0, 10)
					: box.right + rand(0, 10)
				: rand(box.left, box.right),
			y: onSide ? rand(box.top + (box.bottom - box.top) * 0.4, box.bottom) : box.bottom + 4,
			vx: (onSide ? side : rand(-1, 1)) * rand(0.1, 0.5),
			vy: rand(-2.2, -1),
			life: 0,
			maxLife: rand(70, 150),
			size: rand(1, 2.4),
			seed: Math.random() * 1000,
		});
	};

	const step = (dt: number) => {
		clock += dt;
		flareBoost *= Math.pow(0.94, dt);
		intensity += (target + flareBoost - intensity) * Math.min(1, 0.04 * dt);

		const bedRate = ((box.right - box.left) / 22) * intensity;
		const wallRate = compact
			? compactSpots() * 0.75 * intensity
			: (Math.min(box.bottom - box.top, WALL_SPAN_MAX) / 18) * intensity;
		for (let n = bedRate * dt; n > 0; n -= 1) if (n >= 1 || Math.random() < n) spawnFlame(0);
		for (let n = wallRate * dt; n > 0; n -= 1) {
			if (n >= 1 || Math.random() < n) {
				spawnFlame(-1);
				spawnFlame(1);
			}
		}
		if (Math.random() < 0.18 * intensity * dt) spawnEmber();

		for (let index = flames.length - 1; index >= 0; index -= 1) {
			const flame = flames[index]!;
			flame.life += dt;
			if (flame.life >= flame.maxLife) {
				flames.splice(index, 1);
				continue;
			}
			const wobble =
				Math.sin(clock * 0.12 + flame.seed) * 0.06 + Math.sin(clock * 0.31 + flame.seed * 2) * 0.04;
			const drift = compact ? 0.3 : 1;
			flame.vx = (flame.vx + (wobble * dt + flame.side * 0.012 * dt) * drift) * Math.pow(0.97, dt);
			flame.vy -= 0.045 * dt;
			flame.x += flame.vx * dt;
			flame.y += flame.vy * dt;
		}

		for (let index = embers.length - 1; index >= 0; index -= 1) {
			const ember = embers[index]!;
			ember.life += dt;
			if (ember.life >= ember.maxLife || ember.y < -10) {
				embers.splice(index, 1);
				continue;
			}
			ember.vx += Math.sin(clock * 0.08 + ember.seed) * 0.03 * dt;
			ember.vy *= Math.pow(0.992, dt);
			ember.x += ember.vx * dt;
			ember.y += ember.vy * dt;
		}
	};

	const draw = () => {
		ctx.clearRect(0, 0, width, height);
		// Older, cooler particles first; the hot new ones land on top as the core.
		for (const flame of flames) {
			const t = flame.life / flame.maxLife;
			const sprite = sprites[Math.min(SPRITE_STEPS - 1, Math.floor(t * SPRITE_STEPS))];
			if (!sprite) continue;
			const fadeIn = Math.min(1, t / 0.12);
			const size = flame.size * (1.15 - t * 0.75);
			// Stretch upward so particles read as tongues, not blobs.
			ctx.globalAlpha = fadeIn * 0.62;
			ctx.drawImage(sprite, flame.x - size * 0.4, flame.y - size * 1.2, size * 0.8, size * 2.3);
		}
		ctx.globalCompositeOperation = 'lighter';
		for (const ember of embers) {
			const t = ember.life / ember.maxLife;
			const flicker = 0.55 + 0.45 * Math.sin(clock * 0.5 + ember.seed);
			ctx.globalAlpha = (1 - t) * flicker;
			ctx.fillStyle = t < 0.5 ? '#ffd27a' : '#ff8a2a';
			ctx.beginPath();
			ctx.arc(ember.x, ember.y, ember.size, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.globalAlpha = 1;
		ctx.globalCompositeOperation = 'source-over';
	};

	const loop = (now: number) => {
		frame = requestAnimationFrame(loop);
		const dt = last ? Math.min(3, (now - last) / 16.667) : 1;
		last = now;
		if (!visible) return;
		step(dt);
		draw();
	};

	measure();
	const resizer = new ResizeObserver(measure);
	resizer.observe(card);
	resizer.observe(canvas);
	const watcher = new IntersectionObserver(([entry]) => {
		visible = Boolean(entry?.isIntersecting);
	});
	watcher.observe(canvas);
	frame = requestAnimationFrame(loop);

	return {
		flare: () => {
			flareBoost = Math.min(1.4, flareBoost + 1);
		},
		destroy: () => {
			cancelAnimationFrame(frame);
			resizer.disconnect();
			watcher.disconnect();
			target = 0;
		},
	};
}
