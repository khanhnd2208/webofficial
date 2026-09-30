/**
 * One recorded audio file for a whole night, stitched on the host phone.
 * A plain <audio> element keeps playing with the screen locked and (on iPhone) with the
 * silent switch on — speech synthesis and Web Audio do neither.
 */
import {
	nightDurationMs,
	nightTiming,
	type CheeseMode,
	type NightNumber,
} from '@/features/cheese-thief/config/cheeseThief';
import { MIX_RATE, encodeWav, mixNight } from '@/features/cheese-thief/lib/nightMix';
import {
	nightCues,
	roundPreviewCues,
	type NightCue,
	type VoiceClip,
} from '@/features/cheese-thief/lib/nightSchedule';
import { withBasePath } from '@/features/board-game-shared/lib/basePath';

type Locale = 'vi' | 'en';

export interface NightTrackSpec {
	locale: Locale;
	mode: CheeseMode;
	night: NightNumber;
	hourSeconds: number;
}

const tracks = new Map<string, Promise<string | null>>();
const ready = new Map<string, string>();
const decoded = new Map<string, Promise<Float32Array>>();

export function clipUrl(locale: Locale, clip: VoiceClip): string {
	return withBasePath(`/board-game/cheese-thief/voice/${locale}/${clip}.m4a`);
}

export function nightTrackKey(spec: NightTrackSpec): string {
	return `night|${spec.locale}|${spec.mode}|${spec.night}|${spec.hourSeconds}`;
}

function previewKey(locale: Locale, hourSeconds: number): string {
	return `round|${locale}|${hourSeconds}`;
}

export function nightTrackSeconds(spec: NightTrackSpec): number {
	return nightDurationMs(nightTiming(spec.hourSeconds)) / 1000;
}

/** The blob URL if the track is already built. Synchronous, so a tap handler can start it. */
export function readyNightTrack(spec: NightTrackSpec): string | null {
	return ready.get(nightTrackKey(spec)) ?? null;
}

export function readyRoundPreview(locale: Locale, hourSeconds: number): string | null {
	return ready.get(previewKey(locale, hourSeconds)) ?? null;
}

/** Builds once per spec. Resolves to null when this browser cannot build it; the host then falls back to speech. */
export function prepareNightTrack(spec: NightTrackSpec): Promise<string | null> {
	return prepare(nightTrackKey(spec), () =>
		buildTrack(
			spec.locale,
			nightCues(spec.mode, spec.night, nightTiming(spec.hourSeconds)),
			nightTrackSeconds(spec),
		),
	);
}

/** "1 o'clock" through "2 o'clock" at the chosen length. */
export function prepareRoundPreview(locale: Locale, hourSeconds: number): Promise<string | null> {
	const { cues, seconds } = roundPreviewCues(nightTiming(hourSeconds));
	return prepare(previewKey(locale, hourSeconds), () => buildTrack(locale, cues, seconds));
}

function prepare(key: string, build: () => Promise<string>): Promise<string | null> {
	let pending = tracks.get(key);
	if (!pending) {
		pending = build().then(
			(url) => {
				ready.set(key, url);
				return url;
			},
			() => {
				tracks.delete(key);
				return null;
			},
		);
		tracks.set(key, pending);
	}
	return pending;
}

function decodeClip(locale: Locale, clip: VoiceClip): Promise<Float32Array> {
	const key = `${locale}/${clip}`;
	let pending = decoded.get(key);
	if (!pending) {
		pending = (async () => {
			const res = await fetch(clipUrl(locale, clip));
			if (!res.ok) throw new Error(`Missing narration clip ${key}`);
			// Decoding through a context at the mix rate resamples the clip for us.
			const ctx = new OfflineAudioContext(1, 1, MIX_RATE);
			const buffer = await ctx.decodeAudioData(await res.arrayBuffer());
			return buffer.getChannelData(0).slice();
		})();
		pending.catch(() => decoded.delete(key));
		decoded.set(key, pending);
	}
	return pending;
}

async function buildTrack(locale: Locale, cues: NightCue[], seconds: number): Promise<string> {
	if (typeof window === 'undefined' || typeof OfflineAudioContext === 'undefined') {
		throw new Error('No OfflineAudioContext');
	}
	const names = [...new Set(cues.map((cue) => cue.clip))];
	const clips = new Map(
		await Promise.all(names.map(async (clip) => [clip, await decodeClip(locale, clip)] as const)),
	);
	const samples = mixNight({ cues, clips, seconds });
	return URL.createObjectURL(new Blob([encodeWav(samples, MIX_RATE)], { type: 'audio/wav' }));
}

let silence: string | null = null;

/** A tenth of a second of nothing, for unlocking the <audio> element inside a tap. */
export function silentClipUrl(): string {
	silence ??= URL.createObjectURL(
		new Blob([encodeWav(new Float32Array(1_600), 16_000)], { type: 'audio/wav' }),
	);
	return silence;
}
