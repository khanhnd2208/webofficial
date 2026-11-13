// Âm thanh tổng hợp bằng Web Audio. Mỗi hàm là một "tiếng" của sân khấu;
// khi có file thu thật, thay phần thân hàm bằng phát file là đủ.
window.FMT = window.FMT || {};
FMT.sound = (() => {
	let ctx;
	let master;
	let noiseBuffer;
	let enabled = true;
	let charge = null;

	function ensure() {
		if (!enabled) return null;
		const AC = window.AudioContext || window.webkitAudioContext;
		if (!AC) return null;
		if (!ctx) {
			ctx = new AC();
			const comp = ctx.createDynamicsCompressor();
			master = ctx.createGain();
			master.gain.value = 0.7;
			master.connect(comp).connect(ctx.destination);
			noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
			const data = noiseBuffer.getChannelData(0);
			for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
		}
		if (ctx.state === 'suspended') void ctx.resume();
		return ctx;
	}

	function envelope(param, start, attack, peak, decay) {
		param.setValueAtTime(0.0001, start);
		param.exponentialRampToValueAtTime(peak, start + attack);
		param.exponentialRampToValueAtTime(0.0001, start + attack + decay);
	}

	// Một nốt nhạc. `to` cho phép trượt cao độ, `lowpass` làm tiếng ấm như kèn.
	function note(freq, at, dur, opts = {}) {
		if (!ensure()) return;
		const { type = 'sine', peak = 0.2, attack = 0.008, to, lowpass } = opts;
		const start = ctx.currentTime + at;
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.type = type;
		osc.frequency.setValueAtTime(freq, start);
		if (to) osc.frequency.exponentialRampToValueAtTime(to, start + dur);
		envelope(gain.gain, start, attack, peak, dur);
		let tail = osc;
		if (lowpass) {
			const filter = ctx.createBiquadFilter();
			filter.type = 'lowpass';
			filter.frequency.value = lowpass;
			osc.connect(filter);
			tail = filter;
		}
		tail.connect(gain).connect(master);
		osc.start(start);
		osc.stop(start + attack + dur + 0.05);
	}

	// Tiếng ồn có lọc: dùng cho tiếng gõ, tiếng gió, trống và chũm chọe.
	function noise(at, dur, opts = {}) {
		if (!ensure()) return;
		const { peak = 0.2, type = 'bandpass', freq = 2000, to, q = 1, attack = 0.004 } = opts;
		const start = ctx.currentTime + at;
		const source = ctx.createBufferSource();
		const filter = ctx.createBiquadFilter();
		const gain = ctx.createGain();
		source.buffer = noiseBuffer;
		source.loop = true;
		filter.type = type;
		filter.Q.value = q;
		filter.frequency.setValueAtTime(freq, start);
		if (to) filter.frequency.exponentialRampToValueAtTime(to, start + dur);
		envelope(gain.gain, start, attack, peak, dur);
		source.connect(filter).connect(gain).connect(master);
		source.start(start, Math.random());
		source.stop(start + attack + dur + 0.05);
	}

	const marimba = (freq, at, peak = 0.22) => {
		note(freq, at, 0.32, { type: 'sine', peak });
		note(freq * 4, at, 0.07, { type: 'sine', peak: peak * 0.35 });
	};
	const brass = (freq, at, dur, peak = 0.12) => {
		note(freq, at, dur, { type: 'sawtooth', peak, attack: 0.03, lowpass: 2200 });
		note(freq * 1.005, at, dur, {
			type: 'sawtooth',
			peak: peak * 0.7,
			attack: 0.03,
			lowpass: 1800,
		});
	};

	return {
		get enabled() {
			return enabled;
		},
		unlock: ensure,
		setEnabled(value) {
			enabled = value;
			if (!value) this.chargeStop();
			else ensure();
		},

		blip() {
			marimba(880, 0, 0.12);
		},
		select() {
			marimba(523, 0, 0.16);
			marimba(784, 0.08, 0.16);
		},

		// Tiếng lắc túi: một nốt rền cao dần theo lực giữ.
		chargeStart() {
			if (!ensure() || charge) return;
			const osc = ctx.createOscillator();
			const filter = ctx.createBiquadFilter();
			const gain = ctx.createGain();
			const lfo = ctx.createOscillator();
			const lfoGain = ctx.createGain();
			osc.type = 'sawtooth';
			osc.frequency.value = 110;
			filter.type = 'lowpass';
			filter.frequency.value = 500;
			gain.gain.value = 0.0001;
			lfo.frequency.value = 8;
			lfoGain.gain.value = 0.03;
			lfo.connect(lfoGain).connect(gain.gain);
			osc.connect(filter).connect(gain).connect(master);
			osc.start();
			lfo.start();
			charge = { osc, filter, gain, lfo };
		},
		chargeUpdate(power) {
			if (!charge) return;
			const now = ctx.currentTime;
			charge.osc.frequency.setTargetAtTime(110 * 2 ** (power * 2.2), now, 0.04);
			charge.filter.frequency.setTargetAtTime(500 + power * 2600, now, 0.04);
			charge.gain.gain.setTargetAtTime(0.04 + power * 0.07, now, 0.04);
			charge.lfo.frequency.setTargetAtTime(8 + power * 14, now, 0.04);
		},
		chargeStop() {
			if (!charge) return;
			const { osc, gain, lfo } = charge;
			charge = null;
			const now = ctx.currentTime;
			gain.gain.cancelScheduledValues(now);
			gain.gain.setTargetAtTime(0.0001, now, 0.03);
			osc.stop(now + 0.2);
			lfo.stop(now + 0.2);
		},
		rattle(power) {
			noise(0, 0.05, { peak: 0.05 + power * 0.08, freq: 1800 + Math.random() * 2400, q: 2 });
		},
		fizzle() {
			note(330, 0, 0.35, { type: 'triangle', peak: 0.16, to: 110 });
			noise(0, 0.3, { peak: 0.06, type: 'highpass', freq: 3000 });
		},

		launch(power) {
			noise(0, 0.55, { peak: 0.22, freq: 400, to: 5200, q: 1.4, attack: 0.02 });
			note(180, 0, 0.3, { type: 'triangle', peak: 0.3, to: 720 + power * 500 });
			note(90, 0, 0.18, { type: 'sine', peak: 0.4, to: 45 });
		},
		pop(index = 0) {
			marimba(660 + index * 55, 0, 0.1);
		},

		// Tiếng kim gõ vào từng ô. `speed` 0..1: quay nhanh thì tiếng cao và mỏng hơn.
		tick(speed) {
			note(700 + speed * 700, 0, 0.035, { type: 'square', peak: 0.07, to: 380 });
			noise(0, 0.025, { peak: 0.12, freq: 3200, q: 3 });
		},
		lock() {
			note(140, 0, 0.28, { type: 'sine', peak: 0.5, to: 52 });
			marimba(1568, 0.02, 0.2);
		},
		gulp(index) {
			note(420 - index * 14, 0, 0.09, { type: 'sine', peak: 0.12, to: 200 });
		},
		whoosh() {
			noise(0, 0.45, { peak: 0.16, freq: 3800, to: 500, q: 1.2, attack: 0.05 });
		},
		nearMiss() {
			note(520, 0, 0.4, { type: 'triangle', peak: 0.16, to: 300 });
		},

		drumroll(dur) {
			const hits = Math.floor(dur * 26);
			for (let i = 0; i < hits; i += 1) {
				const k = i / hits;
				noise(i / 26, 0.045, { peak: 0.05 + k * 0.22, freq: 240 + k * 120, q: 0.8 });
			}
			note(60, 0, dur, { type: 'sine', peak: 0.2, to: 90, attack: dur * 0.8 });
		},
		crash() {
			noise(0, 1.6, { peak: 0.3, type: 'highpass', freq: 5200, attack: 0.002 });
			note(110, 0, 0.5, { type: 'sine', peak: 0.55, to: 40 });
		},

		winCommon() {
			[523, 659, 784].forEach((f, i) => marimba(f, i * 0.09));
		},
		winRare() {
			[523, 659, 784, 1047, 1319].forEach((f, i) => marimba(f, i * 0.085));
			noise(0.3, 0.6, { peak: 0.05, type: 'highpass', freq: 7000 });
			brass(523, 0.42, 0.5, 0.07);
			brass(784, 0.42, 0.5, 0.06);
		},
		winEpic() {
			[
				[392, 0],
				[523, 0.15],
				[659, 0.3],
			].forEach(([f, at]) => brass(f, at, 0.16, 0.14));
			[262, 392, 523, 659, 784].forEach((f) => brass(f, 0.46, 1.25, 0.09));
			[1047, 1319, 1568, 2093, 1568, 2093, 2637].forEach((f, i) => marimba(f, 0.6 + i * 0.1, 0.1));
			[
				[698, 1.75],
				[784, 1.9],
				[1047, 2.05],
			].forEach(([f, at]) => brass(f, at, at > 2 ? 1.1 : 0.14, 0.11));
			[349, 523, 659].forEach((f) => brass(f, 2.05, 1.1, 0.07));
		},
		winLuck() {
			[659, 784, 1047, 784, 1047, 1319].forEach((f, i) =>
				note(f, i * 0.13, 0.5, { type: 'sine', peak: 0.13 }),
			);
		},
		stamp() {
			note(160, 0, 0.16, { type: 'sine', peak: 0.5, to: 60 });
			noise(0, 0.07, { peak: 0.2, freq: 900, q: 0.7 });
		},
		firework() {
			noise(0, 0.5, {
				peak: 0.1,
				type: 'highpass',
				freq: 2500 + Math.random() * 2500,
				attack: 0.003,
			});
			note(90, 0, 0.2, { type: 'sine', peak: 0.2, to: 50 });
		},
	};
})();
