/**
 * Booth sounds, synthesised with Web Audio so there are no audio files to
 * ship. Same approach as the Recall Arena sounds.
 */

export type BoothSound = 'pick' | 'rummage' | 'pop' | 'fanfare' | 'luck';

const MUTE_KEY = 'fmt2026:muted';

let context: AudioContext | null = null;

export function readMuted(): boolean {
	try {
		return window.localStorage.getItem(MUTE_KEY) === '1';
	} catch {
		return false;
	}
}

export function storeMuted(muted: boolean) {
	try {
		window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
	} catch {
		// Private mode: the toggle still works for this visit.
	}
}

function audio(): AudioContext | null {
	if (typeof window === 'undefined') return null;
	if (!context) {
		const Ctor =
			window.AudioContext ??
			(window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
		if (!Ctor) return null;
		context = new Ctor();
	}
	if (context.state === 'suspended') void context.resume();
	return context;
}

function tone(ctx: AudioContext, freq: number, start: number, length: number, gain = 0.18) {
	const osc = ctx.createOscillator();
	const amp = ctx.createGain();
	osc.type = 'triangle';
	osc.frequency.setValueAtTime(freq, start);
	amp.gain.setValueAtTime(0.0001, start);
	amp.gain.exponentialRampToValueAtTime(gain, start + 0.02);
	amp.gain.exponentialRampToValueAtTime(0.0001, start + length);
	osc.connect(amp).connect(ctx.destination);
	osc.start(start);
	osc.stop(start + length + 0.05);
}

function rustle(ctx: AudioContext, start: number, length: number) {
	const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * length), ctx.sampleRate);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * 0.5;
	const source = ctx.createBufferSource();
	const filter = ctx.createBiquadFilter();
	const amp = ctx.createGain();
	filter.type = 'bandpass';
	filter.frequency.value = 2400;
	amp.gain.setValueAtTime(0.0001, start);
	amp.gain.exponentialRampToValueAtTime(0.12, start + 0.03);
	amp.gain.exponentialRampToValueAtTime(0.0001, start + length);
	source.buffer = buffer;
	source.connect(filter).connect(amp).connect(ctx.destination);
	source.start(start);
}

export function playBoothSound(sound: BoothSound, muted: boolean) {
	if (muted) return;
	const ctx = audio();
	if (!ctx) return;
	const now = ctx.currentTime;
	switch (sound) {
		case 'pick':
			tone(ctx, 660, now, 0.12);
			tone(ctx, 990, now + 0.08, 0.16);
			break;
		case 'rummage':
			for (let i = 0; i < 6; i += 1) rustle(ctx, now + i * 0.18, 0.14);
			break;
		case 'pop':
			tone(ctx, 440, now, 0.08, 0.25);
			tone(ctx, 880, now + 0.05, 0.2, 0.2);
			break;
		case 'fanfare':
			[523, 659, 784, 1047].forEach((freq, i) => tone(ctx, freq, now + i * 0.11, 0.35));
			tone(ctx, 1319, now + 0.5, 0.7, 0.14);
			break;
		case 'luck':
			[784, 659, 784].forEach((freq, i) => tone(ctx, freq, now + i * 0.14, 0.3, 0.12));
			break;
	}
}
