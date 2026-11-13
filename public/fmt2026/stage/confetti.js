// Giấy vụn, pháo giấy và trái tim trên một canvas phủ sân khấu.
// Mọi kích thước tính theo bề rộng sân khấu để hình giống nhau ở mọi màn hình.
window.FMT = window.FMT || {};
FMT.confetti = (canvas) => {
	const context = canvas.getContext('2d');
	let parts = [];
	let frameId = 0;
	let last = 0;
	let width = 0;
	let height = 0;
	let rainUntil = 0;
	let rainColors = [];

	function resize() {
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		width = canvas.clientWidth;
		height = canvas.clientHeight;
		canvas.width = width * dpr;
		canvas.height = height * dpr;
		context.setTransform(dpr, 0, 0, dpr, 0, 0);
	}

	function add(part) {
		parts.push({
			age: 0,
			spin: (Math.random() - 0.5) * 14,
			rot: Math.random() * 6,
			wobble: Math.random() * 6,
			...part,
		});
		if (!frameId) {
			resize();
			last = performance.now();
			frameId = requestAnimationFrame(frame);
		}
	}

	function draw(part) {
		const fade = Math.min(1, (part.life - part.age) / 0.45);
		context.save();
		context.globalAlpha = Math.max(0, fade);
		context.translate(part.x, part.y);
		context.rotate(part.rot);
		context.fillStyle = part.color;
		const s = part.size;
		if (part.shape === 'heart') {
			context.beginPath();
			context.moveTo(0, s * 0.35);
			context.bezierCurveTo(-s, -s * 0.35, -s * 0.5, -s, 0, -s * 0.45);
			context.bezierCurveTo(s * 0.5, -s, s, -s * 0.35, 0, s * 0.35);
			context.fill();
		} else if (part.shape === 'spark') {
			context.shadowColor = part.color;
			context.shadowBlur = s * 2.5;
			context.beginPath();
			context.arc(0, 0, s * 0.5, 0, Math.PI * 2);
			context.fill();
		} else if (part.shape === 'dot') {
			context.beginPath();
			context.arc(0, 0, s * 0.5, 0, Math.PI * 2);
			context.fill();
		} else {
			// Mảnh giấy lật: bề cao co giãn theo góc lắc để trông như đang xoay trong không khí.
			context.fillRect(
				-s / 2,
				-s * 0.3 * Math.cos(part.wobble),
				s,
				s * 0.6 * Math.cos(part.wobble),
			);
		}
		context.restore();
	}

	function frame(now) {
		const dt = Math.min(0.05, (now - last) / 1000);
		last = now;
		if (now < rainUntil && Math.random() < 0.9) {
			for (let i = 0; i < 3; i += 1) {
				add({
					x: Math.random() * width,
					y: -10,
					vx: (Math.random() - 0.5) * width * 0.05,
					vy: width * (0.08 + Math.random() * 0.1),
					size: width * (0.006 + Math.random() * 0.008),
					color: rainColors[Math.floor(Math.random() * rainColors.length)],
					life: 5,
					gravity: 0.08,
					drag: 0.6,
					shape: Math.random() < 0.2 ? 'dot' : 'paper',
				});
			}
		}
		context.clearRect(0, 0, width, height);
		parts = parts.filter((part) => part.age < part.life && part.y < height + 40);
		for (const part of parts) {
			part.age += dt;
			part.vy += width * part.gravity * dt;
			part.vx *= 1 - part.drag * dt;
			part.vy *= 1 - part.drag * dt;
			part.x +=
				part.vx * dt + Math.sin(part.wobble) * width * 0.0006 * (part.shape === 'paper' ? 1 : 0);
			part.y += part.vy * dt;
			part.rot += part.spin * dt;
			part.wobble += dt * 7;
			draw(part);
		}
		frameId = parts.length || now < rainUntil ? requestAnimationFrame(frame) : 0;
	}

	addEventListener('resize', resize);

	return {
		// Bắn một chùm giấy từ (x, y), tọa độ theo tỉ lệ 0..1 của sân khấu.
		burst({ x, y, count = 40, colors, angle = -Math.PI / 2, spread = Math.PI, power = 1, shape }) {
			resize();
			for (let i = 0; i < count; i += 1) {
				const dir = angle + (Math.random() - 0.5) * spread;
				const speed = width * (0.18 + Math.random() * 0.42) * power;
				add({
					x: x * width,
					y: y * height,
					vx: Math.cos(dir) * speed,
					vy: Math.sin(dir) * speed,
					size: width * (0.006 + Math.random() * 0.009),
					color: colors[i % colors.length],
					life: 2.2 + Math.random() * 1.2,
					gravity: 0.55,
					drag: 1.4,
					shape: shape || (Math.random() < 0.18 ? 'dot' : 'paper'),
				});
			}
		},
		firework({ x, y, colors }) {
			resize();
			const count = 46;
			for (let i = 0; i < count; i += 1) {
				const dir = (i / count) * Math.PI * 2;
				const speed = width * (0.12 + Math.random() * 0.1);
				add({
					x: x * width,
					y: y * height,
					vx: Math.cos(dir) * speed,
					vy: Math.sin(dir) * speed,
					size: width * 0.006,
					color: colors[i % colors.length],
					life: 1 + Math.random() * 0.5,
					gravity: 0.12,
					drag: 2.2,
					shape: 'spark',
					spin: 0,
				});
			}
		},
		rain(seconds, colors) {
			resize();
			rainColors = colors;
			rainUntil = performance.now() + seconds * 1000;
			if (!frameId) {
				last = performance.now();
				frameId = requestAnimationFrame(frame);
			}
		},
		hearts(count, colors) {
			resize();
			for (let i = 0; i < count; i += 1) {
				add({
					x: width * (i % 2 ? 0.2 + Math.random() * 0.15 : 0.65 + Math.random() * 0.15),
					y: height * (0.6 + Math.random() * 0.18),
					vx: (Math.random() - 0.5) * width * 0.05,
					vy: -width * (0.05 + Math.random() * 0.08),
					size: width * (0.008 + Math.random() * 0.012),
					color: colors[i % colors.length],
					life: 2.6 + Math.random() * 1.4,
					gravity: -0.015,
					drag: 0.3,
					shape: 'heart',
					spin: (Math.random() - 0.5) * 0.8,
					rot: 0,
				});
			}
		},
		clear() {
			parts = [];
			rainUntil = 0;
			cancelAnimationFrame(frameId);
			frameId = 0;
			context.clearRect(0, 0, width, height);
		},
	};
};
