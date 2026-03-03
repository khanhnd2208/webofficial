'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// RỒNG THĂNG LONG — Professional Suika-style Game Engine
// Physics: Verlet-inspired, high-damping, mass-weighted impulse resolution
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Tuning constants ─────────────────────────────────────────────────────────
const WIDTH = 400;
const HEIGHT = 600;
const GRAVITY = 0.45;            // real Suika-weight gravity
const SUB_STEPS = 10;            // high precision for stable stacking
const SOLVER_ITERS = 8;          // more passes = tighter stacking
const WALL_LEFT = 18;            // wall thickness — container walls
const WALL_RIGHT = WIDTH - 18;
const FLOOR_Y = HEIGHT - 14;     // floor
const GAMEOVER_Y = 90;           // danger line Y
const DAMPING = 0.999;           // minimal air damping
const FLOOR_FRICTION = 0.72;     // floor slows horizontal motion
const WALL_RESTITUTION = 0.18;   // walls absorb impact
const FLOOR_RESTITUTION = 0.15;  // floor absorbs — fruits don't bounce much
const BALL_RESTITUTION = 0.10;   // slight bounce between fruits
const SLEEP_VEL = 0.4;           // sleep threshold
const SLEEP_FRAMES = 10;         // frames before sleeping
const ANGULAR_DAMPING = 0.88;    // rotation damps quickly
const DROP_COOLDOWN_MS = 320;    // ms cooldown between drops
const GRACE_FRAMES = 100;        // frames before a fruit can trigger game-over

// Container visual style
const BG_TOP = '#FFF8E7';        // warm cream — like real Suika
const BG_BOT = '#FFE4B5';        // moccasin warm bottom
const WALL_COLOR = '#C8860A';    // wooden wall color
const FLOOR_COLOR = '#C8860A';

// ─── Fruit Data (11 levels — merge to evolve) ────────────────────────────────
// color = solid fill like real Suika Game, emoji drawn on top
const FRUIT_DATA = [
	{ emoji: '🍒', radius: 16, points: 10,  mass: 1.0, color: '#E8192C', stroke: '#C01020', label: 'Anh đào' },
	{ emoji: '🍓', radius: 21, points: 20,  mass: 1.5, color: '#FF3355', stroke: '#CC1133', label: 'Dâu tây' },
	{ emoji: '🍇', radius: 26, points: 30,  mass: 2.0, color: '#8B2FC9', stroke: '#6B1FA9', label: 'Nho' },
	{ emoji: '🍊', radius: 31, points: 40,  mass: 2.8, color: '#FF7700', stroke: '#DD5500', label: 'Cam' },
	{ emoji: '🍋', radius: 36, points: 50,  mass: 3.5, color: '#FFD700', stroke: '#CCB000', label: 'Chanh' },
	{ emoji: '🍎', radius: 41, points: 60,  mass: 4.5, color: '#DD1111', stroke: '#AA0000', label: 'Táo' },
	{ emoji: '🍐', radius: 46, points: 70,  mass: 5.5, color: '#77BB33', stroke: '#558811', label: 'Lê' },
	{ emoji: '🍑', radius: 51, points: 80,  mass: 7.0, color: '#FF8866', stroke: '#DD6644', label: 'Đào' },
	{ emoji: '🍍', radius: 56, points: 90,  mass: 8.5, color: '#DDAA00', stroke: '#BB8800', label: 'Dứa' },
	{ emoji: '🍉', radius: 62, points: 100, mass: 10,  color: '#33BB44', stroke: '#229933', label: 'Dưa hấu' },
	{ emoji: '🐉', radius: 68, points: 500, mass: 13,  color: '#FF4400', stroke: '#CC2200', label: 'Rồng Thăng Long' },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Fruit {
	id: number;
	x: number;
	y: number;
	vx: number;
	vy: number;
	angle: number;
	av: number;      // angular velocity
	radius: number;
	level: number;
	mass: number;
	emoji: string;
	color: string;
	stroke: string;
	sleeping: boolean;
	sleepCounter: number;
	merged: boolean;
	age: number;     // real frames since creation
}

interface Particle {
	x: number; y: number;
	vx: number; vy: number;
	life: number; maxLife: number;
	size: number; color: string;
}

interface FloatingText {
	x: number; y: number;
	text: string; color: string;
	life: number; maxLife: number;
}

let _fid = 0;

function makeFruit(x: number, y: number, level: number): Fruit {
	const d = FRUIT_DATA[level];
	return {
		id: _fid++,
		x, y, vx: 0, vy: 0,
		angle: 0, av: 0,
		radius: d.radius,
		level,
		mass: d.mass,
		emoji: d.emoji,
		color: d.color,
		stroke: d.stroke,
		sleeping: false,
		sleepCounter: 0,
		merged: false,
		age: 0,
	};
}

// ─── Web Audio (tiny synthesizer) ─────────────────────────────────────────────
let _actx: AudioContext | null = null;
function actx(): AudioContext | null {
	if (typeof window === 'undefined') return null;
	if (!_actx) try {
		_actx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
	} catch { return null; }
	return _actx;
}
function resumeAudio() { const c = actx(); if (c?.state === 'suspended') void c.resume(); }
function tone(freq: number, ms: number, type: OscillatorType = 'sine', vol = 0.18) {
	const c = actx(); if (!c) return;
	try {
		const o = c.createOscillator(), g = c.createGain();
		o.type = type; o.frequency.value = freq;
		g.gain.setValueAtTime(vol, c.currentTime);
		g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + ms / 1000);
		o.connect(g); g.connect(c.destination);
		o.start(); o.stop(c.currentTime + ms / 1000);
	} catch { /* */ }
}
function sfxDrop() { tone(260 + Math.random() * 40, 50, 'sine', 0.12); }
function sfxMerge(level: number) {
	// pitch rises with level — higher merges sound more triumphant
	const base = 300 + level * 60;
	tone(base, 60, 'triangle', 0.25);
	setTimeout(() => tone(base * 1.25, 100, 'sine', 0.2), 40);
}
function sfxDragon() {
	tone(660, 100, 'sawtooth', 0.35);
	setTimeout(() => tone(990, 200, 'sine', 0.35), 80);
	setTimeout(() => tone(1320, 400, 'sine', 0.3), 180);
	setTimeout(() => tone(1760, 500, 'sine', 0.2), 350);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function DragonGame() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const raf = useRef(0);
	const fruits = useRef<Fruit[]>([]);
	const particles = useRef<Particle[]>([]);
	const floatingTexts = useRef<FloatingText[]>([]);
	const scoreVal = useRef(0);
	const comboVal = useRef(0);
	const shakeVal = useRef(0);
	const flashVal = useRef(0);
	const isOver = useRef(false);
	const nextLvl = useRef(0);
	const aimX = useRef(WIDTH / 2);  // where the aim indicator is
	const canDrop = useRef(true);     // prevents rapid fire
	const dropTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const comboResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const [score, setScore] = useState(0);
	const [highScore, setHighScore] = useState(0);
	const [combo, setCombo] = useState(0);
	const [nextEmoji, setNextEmoji] = useState<string>(FRUIT_DATA[0].emoji);
	const [nextLabel, setNextLabel] = useState<string>(FRUIT_DATA[0].label);
	const [gameOver, setGameOver] = useState(false);
	const [started, setStarted] = useState(false);

	useEffect(() => {
		setHighScore(parseInt(localStorage.getItem('dragonHighScore') ?? '0', 10));
	}, []);

	// ─── Particle burst ──────────────────────────────────────────────────────
	const burst = useCallback((x: number, y: number, dragon: boolean) => {
		const n = dragon ? 55 : 10;
		const cols = dragon
			? ['#ffcc00','#ff9900','#fff','#ffe066','#ff6b00','#ff4444']
			: ['#ffffff','#ddeeff','#ffddaa'];
		for (let i = 0; i < n; i++) {
			const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
			const spd = (dragon ? 2.5 : 1) + Math.random() * (dragon ? 5 : 2);
			particles.current.push({
				x, y,
				vx: Math.cos(a) * spd,
				vy: Math.sin(a) * spd - (dragon ? 3 : 1),
				life: dragon ? 65 : 25,
				maxLife: dragon ? 65 : 25,
				size: dragon ? 4 + Math.random() * 5 : 2 + Math.random() * 2,
				color: cols[Math.floor(Math.random() * cols.length)],
			});
		}
	}, []);

	// ─── Floating score text ─────────────────────────────────────────────────
	const showPoints = useCallback((x: number, y: number, pts: number, isCombo: boolean) => {
		floatingTexts.current.push({
			x, y,
			text: isCombo ? `+${pts} ×${comboVal.current}` : `+${pts}`,
			color: isCombo ? '#ffaa00' : '#ffffff',
			life: 50, maxLife: 50,
		});
	}, []);

	// ─── Merge handler ───────────────────────────────────────────────────────
	const doMerge = useCallback((a: Fruit, b: Fruit) => {
		const lv = Math.min(a.level + 1, 10);
		const mx = (a.x + b.x) / 2;
		const my = Math.min(a.y, b.y);

		fruits.current = fruits.current.filter(f => f !== a && f !== b);
		const nf = makeFruit(mx, my, lv);
		nf.vy = -2.5;       // gentle upward pop
		nf.age = 0;         // reset grace
		fruits.current.push(nf);

		// Combo tracking
		comboVal.current++;
		setCombo(comboVal.current);
		if (comboResetTimer.current) clearTimeout(comboResetTimer.current);
		comboResetTimer.current = setTimeout(() => { comboVal.current = 0; setCombo(0); }, 1800);

		const multiplier = comboVal.current >= 3 ? comboVal.current : 1;
		const pts = FRUIT_DATA[lv].points * multiplier;
		scoreVal.current += pts;
		setScore(scoreVal.current);

		sfxMerge(lv);
		burst(mx, my, lv === 10);
		showPoints(mx, my - 20, pts, comboVal.current >= 2);

		if (lv === 10) {
			flashVal.current = 100;
			shakeVal.current = 12;
			sfxDragon();
			// Auto-save high score
			setTimeout(() => {
				const hs = parseInt(localStorage.getItem('dragonHighScore') ?? '0', 10);
				if (scoreVal.current > hs) {
					localStorage.setItem('dragonHighScore', String(scoreVal.current));
					setHighScore(scoreVal.current);
				}
			}, 150);
		}
	}, [burst, showPoints]);

	// ═════════════════════════════════════════════════════════════════════════
	// GAME LOOP — professional physics
	// ═════════════════════════════════════════════════════════════════════════
	const loop = useCallback(() => {
		const cvs = canvasRef.current;
		if (!cvs) return;
		const ctx = cvs.getContext('2d');
		if (!ctx) return;
		if (isOver.current) return;

		const fs = fruits.current;

		// ── Increment age (once per real frame) ──
		for (const f of fs) f.age++;

		// ── Sub-stepped physics ──────────────────────────────────────────────
		const dt = 1 / SUB_STEPS;
		for (let step = 0; step < SUB_STEPS; step++) {

			// Integrate
			for (const f of fs) {
				if (f.sleeping) continue;
				f.vy += GRAVITY * dt;
				f.vx *= DAMPING;
				f.vy *= DAMPING;
				f.x += f.vx;
				f.y += f.vy;
				f.angle += f.av * dt;
				f.av *= ANGULAR_DAMPING;
			}

			// Boundaries
			for (const f of fs) {
				if (f.sleeping) continue;

				// Floor
				if (f.y + f.radius > FLOOR_Y) {
					f.y = FLOOR_Y - f.radius;
					if (f.vy > 0) {
						f.vy = -f.vy * FLOOR_RESTITUTION;
						f.vx *= FLOOR_FRICTION;
						f.av *= 0.7;
						// Transfer horizontal to rotation (rolling feel)
						f.av += f.vx * 0.02;
					}
				}
				// Walls
				if (f.x - f.radius < WALL_LEFT) {
					f.x = WALL_LEFT + f.radius;
					if (f.vx < 0) { f.vx = -f.vx * WALL_RESTITUTION; f.av -= 0.5; }
				}
				if (f.x + f.radius > WALL_RIGHT) {
					f.x = WALL_RIGHT - f.radius;
					if (f.vx > 0) { f.vx = -f.vx * WALL_RESTITUTION; f.av += 0.5; }
				}
			}

			// Fruit-fruit collision resolution (multiple passes)
			let merged = false;
			for (let iter = 0; iter < SOLVER_ITERS && !merged; iter++) {
				for (let i = 0; i < fs.length && !merged; i++) {
					for (let j = i + 1; j < fs.length && !merged; j++) {
						const a = fs[i], b = fs[j];
						if (a.merged || b.merged) continue;
						const dx = b.x - a.x;
						const dy = b.y - a.y;
						const dist = Math.sqrt(dx * dx + dy * dy);
						const minD = a.radius + b.radius;
						if (dist >= minD || dist < 0.001) continue;

						const nx = dx / dist;
						const ny = dy / dist;
						const overlap = minD - dist;

						// Merge check
						if (a.level === b.level) {
							a.merged = true; b.merged = true;
							doMerge(a, b);
							merged = true;
							break;
						}

						// Mass-weighted separation (heavier fruit moves less)
						const totalMass = a.mass + b.mass;
						const ratioA = b.mass / totalMass;
						const ratioB = a.mass / totalMass;
						const push = overlap * 0.75;  // 75% correction per pass (strong)
						a.x -= nx * push * ratioA;
						a.y -= ny * push * ratioA;
						b.x += nx * push * ratioB;
						b.y += ny * push * ratioB;

						// Clamp Y — never push above danger line
						if (a.y - a.radius < GAMEOVER_Y) a.y = GAMEOVER_Y + a.radius;
						if (b.y - b.radius < GAMEOVER_Y) b.y = GAMEOVER_Y + b.radius;

						// Impulse (mass-weighted, energy-losing)
						const rvx = a.vx - b.vx;
						const rvy = a.vy - b.vy;
						const relVel = rvx * nx + rvy * ny;
						if (relVel < 0) continue; // already separating

						const impulse = relVel * (1 + BALL_RESTITUTION) / totalMass;
						a.vx -= impulse * b.mass * nx;
						a.vy -= impulse * b.mass * ny;
						b.vx += impulse * a.mass * nx;
						b.vy += impulse * a.mass * ny;

						// Slight angular response
						a.av -= relVel * 0.003;
						b.av += relVel * 0.003;

						// Wake if sleeping
						if (a.sleeping) { a.sleeping = false; a.sleepCounter = 0; }
						if (b.sleeping) { b.sleeping = false; b.sleepCounter = 0; }
					}
				}
			}

			// Sleep detection (per sub-step)
			for (const f of fs) {
				if (f.sleeping || f.age < 20) continue;
				const speed = Math.sqrt(f.vx * f.vx + f.vy * f.vy);
				if (speed < SLEEP_VEL && Math.abs(f.av) < 0.1) {
					f.sleepCounter++;
					if (f.sleepCounter >= SLEEP_FRAMES) {
						f.vx = 0; f.vy = 0; f.av = 0;
						f.sleeping = true;
					}
				} else {
					f.sleepCounter = 0;
				}
			}
		}

		// ── Game-over check ──────────────────────────────────────────────────
		for (const f of fs) {
			if (
				f.age > GRACE_FRAMES &&
				!f.merged &&
				f.vy >= 0 &&                        // not flying up
				f.y - f.radius < GAMEOVER_Y + 2
			) {
				isOver.current = true;
				setGameOver(true);
				const hs = parseInt(localStorage.getItem('dragonHighScore') ?? '0', 10);
				if (scoreVal.current > hs) {
					localStorage.setItem('dragonHighScore', String(scoreVal.current));
					setHighScore(scoreVal.current);
				}
				return;
			}
		}

		// ── Update particles ─────────────────────────────────────────────────
		particles.current = particles.current
			.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.18, vx: p.vx * 0.96, life: p.life - 1 }))
			.filter(p => p.life > 0);

		// ── Update floating texts ────────────────────────────────────────────
		floatingTexts.current = floatingTexts.current
			.map(t => ({ ...t, y: t.y - 1.2, life: t.life - 1 }))
			.filter(t => t.life > 0);

		if (shakeVal.current > 0) shakeVal.current *= 0.82;
		if (flashVal.current > 0) flashVal.current--;

		// ══════════════════════════════════════════════════════════════════════
		// DRAW
		// ══════════════════════════════════════════════════════════════════════
		const shake = shakeVal.current;
		const sx = shake > 0.5 ? (Math.random() - 0.5) * shake : 0;
		const sy = shake > 0.5 ? (Math.random() - 0.5) * shake : 0;

		ctx.save();
		ctx.translate(sx, sy);

		// ── Background (warm cream like real Suika) ─────────────────────────
		const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
		bg.addColorStop(0, BG_TOP);
		bg.addColorStop(1, BG_BOT);
		ctx.fillStyle = bg;
		ctx.fillRect(0, 0, WIDTH, HEIGHT);

		// ── Dragon golden flash ──────────────────────────────────────────────
		if (flashVal.current > 0) {
			ctx.fillStyle = `rgba(255,200,0,${(flashVal.current / 100) * 0.25})`;
			ctx.fillRect(0, 0, WIDTH, HEIGHT);
		}

		// ── Container walls (left, right, floor) ────────────────────────────
		// Left wall
		ctx.fillStyle = WALL_COLOR;
		ctx.fillRect(0, GAMEOVER_Y, WALL_LEFT, HEIGHT);
		// Right wall
		ctx.fillRect(WALL_RIGHT, GAMEOVER_Y, WIDTH - WALL_RIGHT, HEIGHT);
		// Floor
		ctx.fillStyle = FLOOR_COLOR;
		ctx.fillRect(0, FLOOR_Y, WIDTH, HEIGHT - FLOOR_Y);
		// Wall top caps
		ctx.fillStyle = '#A06008';
		ctx.fillRect(0, GAMEOVER_Y - 4, WALL_LEFT, 8);
		ctx.fillRect(WALL_RIGHT, GAMEOVER_Y - 4, WIDTH - WALL_RIGHT, 8);

		// ── Aim indicator ────────────────────────────────────────────────────
		if (canDrop.current && !isOver.current) {
			const r = FRUIT_DATA[nextLvl.current].radius;
			const ax = aimX.current;
			// Dashed guide line
			ctx.strokeStyle = 'rgba(0,0,0,0.18)';
			ctx.lineWidth = 1.5;
			ctx.setLineDash([5, 7]);
			ctx.beginPath();
			ctx.moveTo(ax, GAMEOVER_Y);
			ctx.lineTo(ax, FLOOR_Y - 2);
			ctx.stroke();
			ctx.setLineDash([]);

			// Ghost fruit circle + emoji at aim top
			const fd = FRUIT_DATA[nextLvl.current];
			ctx.globalAlpha = 0.45;
			// circle
			ctx.beginPath();
			ctx.arc(ax, GAMEOVER_Y + r + 2, r, 0, Math.PI * 2);
			ctx.fillStyle = fd.color;
			ctx.fill();
			ctx.strokeStyle = fd.stroke;
			ctx.lineWidth = 2.5;
			ctx.stroke();
			// emoji
			ctx.globalAlpha = 0.8;
			ctx.font = `bold ${r * 1.3}px Arial`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.shadowBlur = 0;
			ctx.fillStyle = '#fff';
			ctx.fillText(fd.emoji, ax, GAMEOVER_Y + r + 2);
			ctx.globalAlpha = 1;
		}

		// ── Danger line ──────────────────────────────────────────────────────
		let nearDanger = false;
		for (const f of fs) {
			if (f.age > 30 && f.y - f.radius < GAMEOVER_Y + 50) { nearDanger = true; break; }
		}
		const dangerAlpha = nearDanger ? 0.85 + Math.sin(Date.now() / 120) * 0.15 : 0.5;
		ctx.strokeStyle = `rgba(220,30,30,${dangerAlpha})`;
		ctx.lineWidth = 2;
		ctx.setLineDash([7, 5]);
		ctx.beginPath();
		ctx.moveTo(WALL_LEFT, GAMEOVER_Y);
		ctx.lineTo(WALL_RIGHT, GAMEOVER_Y);
		ctx.stroke();
		ctx.setLineDash([]);
		if (nearDanger) {
			const dg = ctx.createLinearGradient(0, 0, 0, GAMEOVER_Y + 30);
			dg.addColorStop(0, 'rgba(255,0,0,0.12)');
			dg.addColorStop(1, 'rgba(255,0,0,0)');
			ctx.fillStyle = dg;
			ctx.fillRect(WALL_LEFT, 0, WALL_RIGHT - WALL_LEFT, GAMEOVER_Y + 30);
		}
		ctx.fillStyle = `rgba(200,20,20,${dangerAlpha})`;
		ctx.font = 'bold 9px Arial';
		ctx.textAlign = 'right';
		ctx.textBaseline = 'bottom';
		ctx.fillText('⚠ NGUY HIỂM', WALL_RIGHT - 4, GAMEOVER_Y - 3);

		// ── Draw fruits — solid circle + emoji on top ────────────────────────
		ctx.shadowBlur = 0;
		for (const f of fs) {
			if (f.merged) continue;
			ctx.save();
			ctx.translate(f.x, f.y);
			ctx.rotate(f.angle);

			const r = f.radius;

			// Drop shadow
			ctx.shadowColor = 'rgba(0,0,0,0.25)';
			ctx.shadowBlur = 6;
			ctx.shadowOffsetX = 2;
			ctx.shadowOffsetY = 3;

			// Solid filled circle
			ctx.beginPath();
			ctx.arc(0, 0, r, 0, Math.PI * 2);
			ctx.fillStyle = f.color;
			ctx.fill();

			// Outline
			ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
			ctx.strokeStyle = f.stroke;
			ctx.lineWidth = 2.5;
			ctx.stroke();

			// Inner highlight (top-left gloss)
			const hl = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.05, -r * 0.1, -r * 0.2, r * 0.75);
			hl.addColorStop(0, 'rgba(255,255,255,0.55)');
			hl.addColorStop(0.5, 'rgba(255,255,255,0.08)');
			hl.addColorStop(1, 'rgba(0,0,0,0)');
			ctx.beginPath();
			ctx.arc(0, 0, r, 0, Math.PI * 2);
			ctx.fillStyle = hl;
			ctx.fill();

			// Emoji on top — bright, no alpha fade
			if (f.level === 10) {
				ctx.shadowColor = '#ffcc00';
				ctx.shadowBlur = 16 + Math.sin(Date.now() / 200) * 6;
			}
			const fontSize = r * (r < 25 ? 1.1 : 1.0);
			ctx.font = `${fontSize}px Arial`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.globalAlpha = 1;
			ctx.fillText(f.emoji, 0, 1);

			ctx.restore();
		}

		ctx.shadowBlur = 0;

		// ── Particles ────────────────────────────────────────────────────────
		for (const p of particles.current) {
			const a = (p.life / p.maxLife);
			ctx.save();
			ctx.globalAlpha = a * a;
			ctx.fillStyle = p.color;
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.size * (0.3 + a * 0.7), 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();
		}

		// ── Floating score texts ─────────────────────────────────────────────
		for (const t of floatingTexts.current) {
			const a = t.life / t.maxLife;
			ctx.save();
			ctx.globalAlpha = a;
			ctx.fillStyle = t.color;
			ctx.strokeStyle = 'rgba(0,0,0,0.5)';
			ctx.lineWidth = 3;
			ctx.font = `bold ${14 + (1 - a) * 4}px Arial`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.strokeText(t.text, t.x, t.y);
			ctx.fillText(t.text, t.x, t.y);
			ctx.restore();
		}

		ctx.restore(); // shake

		raf.current = requestAnimationFrame(loop);
	}, [doMerge]);

	// ─── Start / Restart ─────────────────────────────────────────────────────
	const startGame = useCallback(() => {
		cancelAnimationFrame(raf.current);
		fruits.current = [];
		particles.current = [];
		floatingTexts.current = [];
		scoreVal.current = 0;
		comboVal.current = 0;
		shakeVal.current = 0;
		flashVal.current = 0;
		isOver.current = false;
		canDrop.current = true;
		_fid = 0;
		nextLvl.current = Math.floor(Math.random() * 4);
		aimX.current = WIDTH / 2;
		setScore(0);
		setCombo(0);
		setGameOver(false);
		setStarted(true);
		setNextEmoji(FRUIT_DATA[nextLvl.current].emoji);
		setNextLabel(FRUIT_DATA[nextLvl.current].label);
		raf.current = requestAnimationFrame(loop);
	}, [loop]);

	useEffect(() => {
		return () => {
			cancelAnimationFrame(raf.current);
			if (dropTimer.current) clearTimeout(dropTimer.current);
			if (comboResetTimer.current) clearTimeout(comboResetTimer.current);
		};
	}, []);

	// ─── Pointer tracking for aim ────────────────────────────────────────────
	const updateAim = useCallback((clientX: number) => {
		const cvs = canvasRef.current;
		if (!cvs) return;
		const rect = cvs.getBoundingClientRect();
		const scale = WIDTH / rect.width;
		const rawX = (clientX - rect.left) * scale;
		const r = FRUIT_DATA[nextLvl.current].radius;
		aimX.current = Math.max(r + 6, Math.min(WIDTH - r - 6, rawX));
	}, []);

	// ─── Drop ────────────────────────────────────────────────────────────────
	const doDrop = useCallback(() => {
		if (isOver.current || !started || !canDrop.current) return;
		canDrop.current = false;

		const r = FRUIT_DATA[nextLvl.current].radius;
		const nf = makeFruit(aimX.current, GAMEOVER_Y + r + 10, nextLvl.current);
		nf.vy = 1.5;  // gentle initial downward push
		fruits.current.push(nf);
		sfxDrop();

		// Pick next fruit (only small ones — 0-4, like real Suika)
		const next = Math.floor(Math.random() * 5);
		nextLvl.current = next;
		setNextEmoji(FRUIT_DATA[next].emoji);
		setNextLabel(FRUIT_DATA[next].label);

		// Cooldown before next drop
		if (dropTimer.current) clearTimeout(dropTimer.current);
		dropTimer.current = setTimeout(() => { canDrop.current = true; }, DROP_COOLDOWN_MS);
	}, [started]);

	// ─── Event handlers ──────────────────────────────────────────────────────
	const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
		updateAim(e.clientX);
	}, [updateAim]);

	const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
		resumeAudio();
		updateAim(e.clientX);
		doDrop();
	}, [updateAim, doDrop]);

	const handleTouch = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
		e.preventDefault();
		resumeAudio();
		updateAim(e.touches[0].clientX);
		doDrop();
	}, [updateAim, doDrop]);

	return (
		<div className="flex flex-col items-center gap-4 pb-12">
			{/* Title */}
			<div className="text-center">
				<h1 className="text-2xl font-black tracking-tight text-foreground flex items-center justify-center gap-2">
					<span>🐉</span> Rồng Thăng Long
				</h1>
				<p className="text-xs text-muted mt-1">Ghép đôi trái cây để triệu hồi Rồng Thăng Long!</p>
			</div>

			{/* Score bar */}
			<div className="flex items-center gap-5 flex-wrap justify-center">
				<div className="flex flex-col items-center">
					<span className="text-[10px] font-bold uppercase tracking-widest text-muted">Điểm</span>
					<span className="text-2xl font-black text-foreground tabular-nums">{score}</span>
				</div>
				<div className="h-8 w-px bg-border" />
				<div className="flex flex-col items-center">
					<span className="text-[10px] font-bold uppercase tracking-widest text-muted">Cao nhất</span>
					<span className="text-2xl font-black text-yellow-400 tabular-nums">{highScore}</span>
				</div>
				{started && !gameOver && (
					<>
						<div className="h-8 w-px bg-border" />
						<div className="flex flex-col items-center">
							<span className="text-[10px] font-bold uppercase tracking-widest text-muted">Tiếp theo</span>
							<span className="text-xl" title={nextLabel}>{nextEmoji}</span>
						</div>
					</>
				)}
				{/* Combo */}
				<div
					className={`flex flex-col items-center transition-all duration-200 ${
						combo >= 2 ? 'opacity-100 scale-110' : 'opacity-0 scale-90 pointer-events-none'
					}`}
				>
					<span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">Combo</span>
					<span className="text-2xl font-black text-orange-400 tabular-nums">×{combo}</span>
				</div>
			</div>

			{/* Canvas */}
			<div className="relative select-none">
				<canvas
					ref={canvasRef}
					width={WIDTH}
					height={HEIGHT}
					className="w-full max-w-100 rounded-2xl border-4 border-[#C8860A] shadow-[0_8px_32px_rgba(200,134,10,0.35)] cursor-crosshair touch-none"
					onClick={handleClick}
					onTouchStart={handleTouch}
					onPointerMove={handlePointerMove}
				/>

				{/* Start overlay */}
				{!started && (
					<div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/75 backdrop-blur-sm">
						<div className="text-6xl mb-4 animate-bounce">🐉</div>
						<h2 className="text-2xl font-black text-white mb-2">Rồng Thăng Long</h2>
						<p className="text-sm text-white/60 text-center px-8 mb-1 leading-relaxed">
							Thả trái cây vào bình. Hai quả giống nhau sẽ hợp nhất thành quả lớn hơn.
						</p>
						<p className="text-sm text-white/60 text-center px-8 mb-6 leading-relaxed">
							Mục tiêu: tạo ra <span className="text-yellow-400 font-bold">🐉 Rồng Thăng Long</span>!
						</p>
						<button
							onClick={startGame}
							className="px-8 py-3 rounded-full bg-yellow-400 text-black text-sm font-black uppercase tracking-widest hover:bg-yellow-300 active:scale-95 transition-all shadow-lg"
						>
							Bắt đầu chơi
						</button>
					</div>
				)}

				{/* Game over overlay */}
				{gameOver && (
					<div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/78 backdrop-blur-sm">
						<div className="text-5xl mb-3">😵</div>
						<h2 className="text-xl font-black text-white mb-1">Game Over!</h2>
						<p className="text-sm text-white/70 mb-1">
							Điểm:{' '}
							<span className="text-white font-bold text-lg">{score}</span>
						</p>
						{score > 0 && score >= highScore && (
							<p className="text-xs text-yellow-400 font-black uppercase tracking-widest mb-3 animate-pulse">
								🏆 Kỷ lục mới!
							</p>
						)}
						<p className="text-xs text-white/40 mb-6">Kỷ lục: {highScore}</p>
						<button
							onClick={startGame}
							className="px-8 py-3 rounded-full bg-yellow-400 text-black text-sm font-black uppercase tracking-widest hover:bg-yellow-300 active:scale-95 transition-all shadow-lg"
						>
							Chơi lại 🔥
						</button>
					</div>
				)}
			</div>

			{/* Evolution chart */}
			<div className="w-full max-w-100">
				<p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2 text-center">
					Bảng tiến hoá
				</p>
				<div className="flex flex-wrap justify-center gap-1.5">
					{FRUIT_DATA.map((f, i) => (
						<div
							key={i}
							title={f.label}
							className={`flex flex-col items-center gap-0.5 rounded-full border-2 px-1.5 py-1 ${
								i === 10 ? 'ring-2 ring-yellow-400 ring-offset-1' : ''
							}`}
							style={{ borderColor: f.stroke, backgroundColor: f.color + '22' }}
						>
							<span className="text-base leading-none">{f.emoji}</span>
							<span className="text-[8px] font-bold" style={{ color: f.stroke }}>{f.points}</span>
						</div>
					))}
				</div>
			</div>

			{/* How to play */}
			<div className="text-xs text-muted/50 text-center max-w-xs leading-relaxed space-y-0.5">
				<p>🎯 Di chuột để ngắm, click/chạm để thả</p>
				<p>🔗 Ghép 2 quả giống nhau → quả lớn hơn</p>
				<p>🔥 Ghép nhanh liên tiếp = combo × điểm</p>
				<p>🐉 Mục tiêu: <span className="text-yellow-400">Rồng Thăng Long!</span></p>
			</div>
		</div>
	);
}
