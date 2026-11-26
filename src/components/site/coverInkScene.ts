import { fragment, vertex } from './coverInkShader';

// Traced in the coordinate systems of the landscape and portrait artwork.
const artwork = {
	landscape: {
		width: 550,
		height: 344,
		path: 'M151 344 C160 321 208 304 189 294 C169 280 241 264 208 250 C191 242 147 239 178 226 S217 215 185 205 S197 195 185 188 L174 183',
	},
	portrait: {
		width: 304,
		height: 380,
		path: 'M198 281 C213 274 249 268 223 262 S206 251 224 245 S246 236 233 231 S218 225 226 222',
	},
};

export function createCoverScene(canvas: HTMLCanvasElement, img: HTMLImageElement) {
	const gl = canvas.getContext('webgl', {
		alpha: false,
		antialias: false,
		depth: false,
		stencil: false,
	});
	if (!gl) return;
	const program = gl.createProgram();
	if (!program) return;
	for (const [kind, source] of [
		[gl.VERTEX_SHADER, vertex],
		[gl.FRAGMENT_SHADER, fragment],
	] as const) {
		const shader = gl.createShader(kind);
		if (!shader) {
			gl.deleteProgram(program);
			return;
		}
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		gl.attachShader(program, shader);
		gl.deleteShader(shader);
	}
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		gl.deleteProgram(program);
		return;
	}
	gl.useProgram(program);
	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
	const pos = gl.getAttribLocation(program, 'position');
	gl.enableVertexAttribArray(pos);
	gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
	const loc = (name: string) => gl.getUniformLocation(program, name);
	const u = {
		crop: loc('crop'),
		view: loc('view'),
		gaze: loc('gaze'),
		impact: loc('impact'),
		age: loc('age'),
		meetingTime: loc('meetingTime'),
		meetingPoint: loc('meetingPoint'),
	};
	const portrait = img.naturalHeight > img.naturalWidth;
	const art = portrait ? artwork.portrait : artwork.landscape;
	const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	path.setAttribute('d', art.path);
	const length = path.getTotalLength();
	const count = Math.ceil(length);
	const points = Array.from({ length: count + 1 }, (_, i) =>
		path.getPointAtLength((length * i) / count),
	);
	const mask = document.createElement('canvas');
	mask.width = art.width * 2;
	mask.height = art.height * 2;
	const ctx = mask.getContext('2d')!;
	ctx.scale(2, 2);
	ctx.lineCap = 'round';
	// Red stores distance along the road. Alpha stores its tapered silhouette.
	for (let i = 1; i <= count; i++) {
		const t = i / count;
		ctx.strokeStyle = 'rgb(' + Math.round(t * 255) + ' 0 0)';
		ctx.lineWidth = 2.6 - 1.85 * t;
		ctx.beginPath();
		ctx.moveTo(points[i - 1].x, points[i - 1].y);
		ctx.lineTo(points[i].x, points[i].y);
		ctx.stroke();
	}
	const textures = [img, mask].map((source, i) => {
		const tex = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0 + i);
		gl.bindTexture(gl.TEXTURE_2D, tex);
		for (const param of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T])
			gl.texParameteri(gl.TEXTURE_2D, param, gl.CLAMP_TO_EDGE);
		for (const param of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER])
			gl.texParameteri(gl.TEXTURE_2D, param, gl.LINEAR);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
		return tex;
	});
	gl.uniform1i(loc('paper'), 0);
	gl.uniform1i(loc('road'), 1);
	gl.uniform1f(loc('portrait'), Number(portrait));
	let sx = 1,
		sy = 1,
		ox = 0,
		oy = 0;
	function resize() {
		const width = canvas.clientWidth,
			height = canvas.clientHeight;
		const ratio = Math.min(devicePixelRatio, portrait ? 1.5 : 2);
		canvas.width = Math.max(1, Math.round(width * ratio));
		canvas.height = Math.max(1, Math.round(height * ratio));
		gl!.viewport(0, 0, canvas.width, canvas.height);
		const fit = Math.max(width / art.width, height / art.height);
		sx = width / (art.width * fit);
		sy = height / (art.height * fit);
		ox = portrait ? (1 - sx) * 0.5 : 0;
		oy = (1 - sy) * (portrait ? 0.2 : 0.5);
		gl!.uniform4f(u.crop, sx, sy, ox, oy);
		gl!.uniform2f(u.view, width, height);
	}
	return {
		resize,
		drop(x: number, y: number) {
			let nearest = Infinity,
				index = 0;
			points.forEach((p, i) => {
				const dx = ((p.x / art.width - ox) / sx - x) * canvas.width;
				const dy = ((p.y / art.height - oy) / sy - y) * canvas.height;
				const d = Math.hypot(dx, dy);
				if (d < nearest) {
					nearest = d;
					index = i;
				}
			});
			gl.uniform2f(u.impact, x, y);
			gl.uniform1f(u.meetingTime, nearest / Math.min(canvas.width, canvas.height) / 0.82);
			gl.uniform1f(u.meetingPoint, index / count);
		},
		draw(age: number, x: number, y: number) {
			gl.uniform1f(u.age, age);
			gl.uniform2f(u.gaze, x, y);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
		},
		dispose() {
			textures.forEach((tex) => gl.deleteTexture(tex));
			gl.deleteBuffer(buffer);
			gl.deleteProgram(program);
		},
	};
}
