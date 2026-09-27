/**
 * Mixes the recorded lines, a music-box bell and a soft clock into one night of samples.
 * Plain arithmetic on Float32Arrays, so the same mix runs on the host phone and in Node
 * (for listening to a sample before a table plays it).
 */
import type { NightCue, VoiceClip } from '@/features/cheese-thief/lib/nightSchedule';

export const MIX_RATE = 44_100;

/** How long each kind of line waits for its bell before the voice starts. */
export const LINE_LEAD_S = { intro: 1.6, wake: 0.35, sleep: 0.3, outro: 0.6, single: 0.35 } as const;

type CueKind = keyof typeof LINE_LEAD_S;

const NOTE = { E4: 329.63, G4: 392, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5 };
/** One pentatonic step per hour, so 1 o'clock through 6 o'clock climb like a music box. */
const HOUR_NOTES = [NOTE.C5, NOTE.D5, NOTE.E5, NOTE.G5, NOTE.A5, NOTE.C6];
const LULLABY: [number, number][] = [
	[0, NOTE.E5],
	[0.3, NOTE.G5],
	[0.6, NOTE.A5],
	[0.9, NOTE.G5],
	[1.25, NOTE.E5],
];
const DAWN: [number, number][] = [
	[0, NOTE.C5],
	[0.12, NOTE.E5],
	[0.24, NOTE.G5],
	[0.36, NOTE.C6],
];

export function cueKind(clip: VoiceClip): CueKind {
	if (clip.startsWith('wake-')) return 'wake';
	if (clip === 'sleep') return 'sleep';
	if (clip === 'night-end' || clip === 'night1-end') return 'outro';
	if (clip === 'cheese-gone') return 'single';
	return 'intro';
}

/** A music-box strike: a few bright partials, each dying away faster than the one below. */
function bell(out: Float32Array, rate: number, atSec: number, freq: number, volume: number): void {
	const partials: [number, number][] = [
		[1, 1],
		[2, 0.32],
		[3, 0.1],
		[4.16, 0.05],
	];
	const start = Math.round(atSec * rate);
	const length = Math.min(out.length - start, Math.round(2.2 * rate));
	for (let i = 0; i < length; i++) {
		const t = i / rate;
		const attack = Math.min(1, t / 0.004);
		let sample = 0;
		for (const [ratio, amp] of partials) {
			sample += amp * Math.exp((-t * ratio) / 0.55) * Math.sin(2 * Math.PI * freq * ratio * t);
		}
		out[start + i]! += volume * attack * sample;
	}
}

/** A wooden tick: a short, quickly damped knock. `tock` sits a little lower. */
function tick(out: Float32Array, rate: number, atSec: number, tock: boolean, volume: number): void {
	const freq = tock ? 1_350 : 1_700;
	const start = Math.round(atSec * rate);
	const length = Math.min(out.length - start, Math.round(0.03 * rate));
	for (let i = 0; i < length; i++) {
		const t = i / rate;
		out[start + i]! += volume * Math.exp(-t / 0.004) * Math.sin(2 * Math.PI * freq * t);
	}
}

function addClip(out: Float32Array, rate: number, atSec: number, clip: Float32Array): void {
	const start = Math.round(atSec * rate);
	const length = Math.min(out.length - start, clip.length);
	for (let i = 0; i < length; i++) out[start + i]! += clip[i]!;
}

export interface MixInput {
	cues: NightCue[];
	/** Decoded mono samples at `rate`, one per clip used by the cues. */
	clips: ReadonlyMap<VoiceClip, Float32Array>;
	seconds: number;
	rate?: number;
	/** The soft clock under the night. Off for a single line. */
	clock?: boolean;
}

export function mixNight({ cues, clips, seconds, rate = MIX_RATE, clock = true }: MixInput): Float32Array {
	const out = new Float32Array(Math.ceil(seconds * rate));
	if (clock) {
		for (let second = 0; second < seconds; second++) tick(out, rate, second, second % 2 === 1, 0.05);
	}
	for (const cue of cues) {
		const at = cue.atMs / 1000;
		const kind = cueKind(cue.clip);
		if (kind === 'intro') for (const [offset, note] of LULLABY) bell(out, rate, at + offset, note, 0.09);
		if (kind === 'outro') for (const [offset, note] of DAWN) bell(out, rate, at + offset, note, 0.08);
		if (kind === 'wake') bell(out, rate, at, HOUR_NOTES[Number(cue.clip.slice(5)) - 1] ?? NOTE.C5, 0.13);
		if (kind === 'sleep') bell(out, rate, at, NOTE.G4, 0.07);
		const samples = clips.get(cue.clip);
		if (samples) addClip(out, rate, at + LINE_LEAD_S[kind], samples);
	}
	for (let i = 0; i < out.length; i++) out[i] = Math.max(-1, Math.min(1, out[i]!));
	return out;
}

/** 16-bit mono WAV at half the mix rate, averaging each pair of samples — speech needs no more. */
export function encodeWav(samples: Float32Array, rate: number): Uint8Array<ArrayBuffer> {
	const outRate = rate / 2;
	const frames = Math.floor(samples.length / 2);
	const bytes = new Uint8Array(44 + frames * 2);
	const view = new DataView(bytes.buffer);
	const ascii = (offset: number, text: string) => {
		for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
	};
	ascii(0, 'RIFF');
	view.setUint32(4, 36 + frames * 2, true);
	ascii(8, 'WAVE');
	ascii(12, 'fmt ');
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true);
	view.setUint16(22, 1, true);
	view.setUint32(24, outRate, true);
	view.setUint32(28, outRate * 2, true);
	view.setUint16(32, 2, true);
	view.setUint16(34, 16, true);
	ascii(36, 'data');
	view.setUint32(40, frames * 2, true);
	for (let i = 0; i < frames; i++) {
		const sample = Math.max(-1, Math.min(1, (samples[2 * i]! + samples[2 * i + 1]!) / 2));
		view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
	}
	return bytes;
}
