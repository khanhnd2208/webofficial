/**
 * Arena sound effects, synthesised with Web Audio so there are no audio files
 * to ship or license. Every sound is a few oscillators and noise bursts.
 */

export type ArenaSound =
	| 'tick'
	| 'hunt'
	| 'roar'
	| 'lock'
	| 'target'
	| 'suck'
	| 'chomp'
	| 'charge'
	| 'launch'
	| 'hit'
	| 'finisher'
	| 'combo'
	| 'laugh'
	| 'heal'
	| 'reveal'
	| 'boss'
	| 'victory';

const MUTE_KEY = 'recall-arena:v1:muted';

let context: AudioContext | null = null;
let master: GainNode | null = null;
let muted: boolean | null = null;

export function isArenaMuted(): boolean {
	if (muted === null) {
		try {
			muted = window.localStorage.getItem(MUTE_KEY) === '1';
		} catch {
			muted = false;
		}
	}
	return muted;
}

const muteListeners = new Set<() => void>();

export function subscribeArenaMuted(listener: () => void) {
	muteListeners.add(listener);
	return () => {
		muteListeners.delete(listener);
	};
}

export function setArenaMuted(next: boolean) {
	muted = next;
	muteListeners.forEach((listener) => listener());
	try {
		window.localStorage.setItem(MUTE_KEY, next ? '1' : '0');
	} catch {
		// Private mode: the choice lasts until reload.
	}
}

/** Browsers only start audio after a click or key press; every play call retries. */
function audio(): { ctx: AudioContext; out: GainNode } | null {
	if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') return null;
	if (!context) {
		try {
			context = new window.AudioContext();
			master = context.createGain();
			master.gain.value = 0.5;
			const limiter = context.createDynamicsCompressor();
			master.connect(limiter).connect(context.destination);
		} catch {
			return null;
		}
	}
	if (context.state === 'suspended') void context.resume().catch(() => undefined);
	return master ? { ctx: context, out: master } : null;
}

interface ToneOptions {
	type?: OscillatorType;
	/** Start frequency in Hz; `to` glides there by the end. */
	from: number;
	to?: number;
	at?: number;
	length: number;
	gain?: number;
}

function tone(
	{ ctx, out }: { ctx: AudioContext; out: GainNode },
	{ type = 'sine', from, to, at = 0, length, gain = 0.3 }: ToneOptions,
) {
	const start = ctx.currentTime + at;
	const oscillator = ctx.createOscillator();
	const envelope = ctx.createGain();
	oscillator.type = type;
	oscillator.frequency.setValueAtTime(from, start);
	if (to) oscillator.frequency.exponentialRampToValueAtTime(to, start + length);
	envelope.gain.setValueAtTime(0.0001, start);
	envelope.gain.exponentialRampToValueAtTime(gain, start + Math.min(0.02, length / 4));
	envelope.gain.exponentialRampToValueAtTime(0.0001, start + length);
	oscillator.connect(envelope).connect(out);
	oscillator.start(start);
	oscillator.stop(start + length + 0.03);
}

interface NoiseOptions {
	at?: number;
	length: number;
	gain?: number;
	filter?: BiquadFilterType;
	from: number;
	to?: number;
}

function noise(
	{ ctx, out }: { ctx: AudioContext; out: GainNode },
	{ at = 0, length, gain = 0.3, filter = 'lowpass', from, to }: NoiseOptions,
) {
	const start = ctx.currentTime + at;
	const frames = Math.max(1, Math.floor(ctx.sampleRate * length));
	const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
	const samples = buffer.getChannelData(0);
	for (let index = 0; index < frames; index += 1) samples[index] = Math.random() * 2 - 1;
	const source = ctx.createBufferSource();
	source.buffer = buffer;
	const shape = ctx.createBiquadFilter();
	shape.type = filter;
	shape.frequency.setValueAtTime(from, start);
	if (to) shape.frequency.exponentialRampToValueAtTime(to, start + length);
	const envelope = ctx.createGain();
	envelope.gain.setValueAtTime(gain, start);
	envelope.gain.exponentialRampToValueAtTime(0.0001, start + length);
	source.connect(shape).connect(envelope).connect(out);
	source.start(start);
}

const SEMITONE = 2 ** (1 / 12);

/**
 * Play one effect. `detail` shifts the pitch where a sound escalates: the scan
 * group for `hunt`, the countdown beat for `tick`, the streak for `combo`.
 */
export function playArenaSound(name: ArenaSound, detail = 0) {
	if (isArenaMuted()) return;
	const a = audio();
	if (!a) return;
	switch (name) {
		case 'tick':
			tone(a, { type: 'square', from: 420 + detail * 48, length: 0.06, gain: 0.12 });
			break;
		case 'hunt': {
			const tension = Math.min(4, detail);
			// Two uneven low pulses under a breathy scrape: closer groups rise slightly.
			tone(a, {
				from: 78 + tension * 5,
				to: 45 + tension * 3,
				length: 0.86,
				gain: 0.24,
			});
			tone(a, {
				type: 'sawtooth',
				from: 114 + tension * 7,
				to: 67 + tension * 4,
				at: 0.025,
				length: 0.74,
				gain: 0.085,
			});
			tone(a, {
				type: 'triangle',
				from: 72 + tension * 4,
				to: 42 + tension * 2,
				at: 0.47,
				length: 0.32,
				gain: 0.19,
			});
			noise(a, {
				length: 0.82,
				gain: 0.075,
				filter: 'bandpass',
				from: 1100 + tension * 180,
				to: 230,
			});
			break;
		}
		case 'roar':
			tone(a, { type: 'sawtooth', from: 130, to: 48, length: 0.9, gain: 0.34 });
			tone(a, { type: 'sawtooth', from: 97, to: 39, length: 0.9, gain: 0.28 });
			tone(a, { type: 'square', from: 64, to: 30, length: 0.9, gain: 0.16 });
			noise(a, { length: 0.9, gain: 0.3, from: 1400, to: 220 });
			break;
		case 'lock':
			tone(a, { type: 'square', from: 880, length: 0.09, gain: 0.16 });
			tone(a, { type: 'square', from: 1320, at: 0.11, length: 0.16, gain: 0.18 });
			break;
		case 'target':
			// A dissonant rise holds on the chosen student before the claw moves.
			tone(a, { type: 'sawtooth', from: 105, to: 330, length: 0.68, gain: 0.16 });
			tone(a, { type: 'sawtooth', from: 112, to: 296, length: 0.68, gain: 0.12 });
			noise(a, { length: 0.68, gain: 0.16, filter: 'bandpass', from: 360, to: 4200 });
			tone(a, { from: 74, to: 32, at: 0.52, length: 0.28, gain: 0.36 });
			break;
		case 'suck':
			tone(a, { type: 'sawtooth', from: 82, to: 1100, length: 0.68, gain: 0.2 });
			tone(a, { type: 'triangle', from: 117, to: 1700, length: 0.68, gain: 0.12 });
			tone(a, { from: 60, to: 38, length: 0.7, gain: 0.18 });
			noise(a, { length: 0.68, gain: 0.22, filter: 'bandpass', from: 260, to: 4800 });
			break;
		case 'chomp':
			noise(a, { length: 0.22, gain: 0.58, from: 2800, to: 180 });
			tone(a, { type: 'sawtooth', from: 120, to: 30, length: 0.45, gain: 0.5 });
			tone(a, { type: 'square', from: 70, to: 28, at: 0.015, length: 0.3, gain: 0.3 });
			tone(a, { from: 48, to: 32, at: 0.08, length: 0.5, gain: 0.4 });
			break;
		case 'charge':
			tone(a, { type: 'triangle', from: 220, to: 1320, length: 0.72, gain: 0.16 });
			tone(a, { from: 330, to: 1980, length: 0.72, gain: 0.08 });
			noise(a, { length: 0.72, gain: 0.07, filter: 'bandpass', from: 500, to: 5200 });
			break;
		case 'launch':
			noise(a, { length: 0.34, gain: 0.34, filter: 'bandpass', from: 3600, to: 420 });
			tone(a, { type: 'sawtooth', from: 880, to: 150, length: 0.3, gain: 0.14 });
			break;
		case 'finisher':
			noise(a, { length: 0.5, gain: 0.6, from: 3000, to: 120 });
			tone(a, { from: 150, to: 28, length: 0.8, gain: 0.6 });
			tone(a, { type: 'square', from: 220, to: 40, at: 0.03, length: 0.4, gain: 0.25 });
			break;
		case 'hit':
			noise(a, { length: 0.18, gain: 0.5, filter: 'highpass', from: 900, to: 300 });
			tone(a, { type: 'square', from: 260, to: 60, length: 0.24, gain: 0.3 });
			tone(a, { type: 'triangle', from: 988, at: 0.14, length: 0.1, gain: 0.22 });
			tone(a, { type: 'triangle', from: 1319, at: 0.23, length: 0.34, gain: 0.24 });
			break;
		case 'combo': {
			const base = 660 * SEMITONE ** Math.min(12, detail * 2);
			tone(a, { type: 'triangle', from: base, at: 0.3, length: 0.1, gain: 0.2 });
			tone(a, { type: 'triangle', from: base * 1.5, at: 0.39, length: 0.3, gain: 0.22 });
			break;
		}
		case 'laugh':
			[330, 290, 320, 270, 300, 240, 210].forEach((pitch, index) => {
				tone(a, {
					type: 'sawtooth',
					from: pitch,
					to: pitch * 0.8,
					at: index * 0.11,
					length: 0.09,
					gain: 0.17,
				});
			});
			break;
		case 'heal':
			[392, 523, 659].forEach((pitch, index) => {
				tone(a, { from: pitch, at: 0.5 + index * 0.09, length: 0.22, gain: 0.16 });
			});
			break;
		case 'reveal':
			noise(a, { length: 0.16, gain: 0.12, filter: 'bandpass', from: 700, to: 3200 });
			tone(a, { type: 'triangle', from: 784, at: 0.06, length: 0.18, gain: 0.14 });
			break;
		case 'boss':
			tone(a, { from: 95, to: 30, length: 0.7, gain: 0.6 });
			noise(a, { length: 0.5, gain: 0.4, from: 900, to: 90 });
			tone(a, { type: 'sawtooth', from: 110, to: 55, at: 0.25, length: 0.7, gain: 0.2 });
			break;
		case 'victory':
			[523, 659, 784, 1047].forEach((pitch, index) => {
				tone(a, { type: 'triangle', from: pitch, at: index * 0.13, length: 0.16, gain: 0.24 });
			});
			[523, 659, 784, 1047, 1319].forEach((pitch) => {
				tone(a, { type: 'triangle', from: pitch, at: 0.56, length: 0.9, gain: 0.14 });
			});
			noise(a, { at: 0.56, length: 0.6, gain: 0.1, filter: 'highpass', from: 5000 });
			break;
	}
}
