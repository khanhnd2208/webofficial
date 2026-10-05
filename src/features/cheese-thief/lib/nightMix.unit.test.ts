import { describe, expect, it } from 'vitest';

import { nightTiming } from '@/features/cheese-thief/config/cheeseThief';
import { LINE_LEAD_S, cueKind, encodeWav, mixNight } from '@/features/cheese-thief/lib/nightMix';
import { roundPreviewCues, type VoiceClip } from '@/features/cheese-thief/lib/nightSchedule';

const RATE = 8_000;

function loudness(samples: Float32Array, fromS: number, toS: number): number {
	let peak = 0;
	for (let i = Math.round(fromS * RATE); i < Math.round(toS * RATE); i++)
		peak = Math.max(peak, Math.abs(samples[i]!));
	return peak;
}

describe('night mix', () => {
	it('starts each line just after its bell, at the cue time', () => {
		const voice = new Float32Array(RATE).fill(0.5);
		const clips = new Map<VoiceClip, Float32Array>([['wake-3', voice]]);
		const out = mixNight({
			cues: [{ atMs: 2_000, clip: 'wake-3' }],
			clips,
			seconds: 5,
			rate: RATE,
			clock: false,
		});
		expect(loudness(out, 0, 1.9)).toBe(0);
		expect(loudness(out, 2, 2 + LINE_LEAD_S.wake - 0.01)).toBeGreaterThan(0);
		expect(loudness(out, 2 + LINE_LEAD_S.wake + 0.1, 2 + LINE_LEAD_S.wake + 0.9)).toBeGreaterThan(
			0.45,
		);
	});

	it('keeps the clock soft and never clips', () => {
		const loud = new Float32Array(RATE).fill(0.99);
		const clips = new Map<VoiceClip, Float32Array>([['night-start', loud]]);
		const out = mixNight({
			cues: [{ atMs: 0, clip: 'night-start' }],
			clips,
			seconds: 4,
			rate: RATE,
		});
		expect(Math.max(...out.map(Math.abs))).toBeLessThanOrEqual(1);
		expect(loudness(out, 3.0, 3.05)).toBeLessThan(0.06);
	});

	it('packs a playable 16-bit WAV at half the mix rate', () => {
		const wav = encodeWav(new Float32Array(RATE), RATE);
		const view = new DataView(wav.buffer);
		expect(String.fromCharCode(...wav.slice(0, 4))).toBe('RIFF');
		expect(view.getUint32(24, true)).toBe(RATE / 2);
		expect(wav.length).toBe(44 + RATE);
	});

	it('names every clip kind', () => {
		expect(
			['night-start', 'wake-1', 'sleep', 'night-end'].map((clip) => cueKind(clip as VoiceClip)),
		).toEqual(['intro', 'wake', 'sleep', 'outro']);
	});
});

describe('round preview', () => {
	it('plays exactly one round: 1 o’clock, back to sleep, then 2 o’clock at the chosen length', () => {
		const { cues, seconds } = roundPreviewCues(nightTiming(12));
		expect(cues).toEqual([
			{ atMs: 0, clip: 'wake-1' },
			{ atMs: 8_000, clip: 'sleep' },
			{ atMs: 12_000, clip: 'wake-2' },
		]);
		expect(seconds).toBeGreaterThan(12 + 3.5);
	});
});
