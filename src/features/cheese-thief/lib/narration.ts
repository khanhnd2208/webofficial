/**
 * Host-only audio. Created from the "Start the night" tap so iOS will speak later.
 * Player phones never call this — a buzz or a chime would give away who is awake.
 *
 * The recorded night track is the main voice; speech synthesis is the fallback when it cannot be built.
 */
import {
	clipUrl,
	nightTrackSeconds,
	prepareRoundPreview,
	readyNightTrack,
	readyRoundPreview,
	silentClipUrl,
	type NightTrackSpec,
} from '@/features/cheese-thief/lib/nightTrack';
import type { VoiceClip } from '@/features/cheese-thief/lib/nightSchedule';

let audioCtx: AudioContext | null = null;
let tableEl: HTMLAudioElement | null = null;

/** One element for the whole session: iOS lets it play later only because a tap played it first. */
function tableAudio(): HTMLAudioElement | null {
	if (typeof window === 'undefined') return null;
	tableEl ??= new Audio();
	return tableEl;
}

function playFrom(el: HTMLAudioElement, url: string, offsetSec: number): Promise<boolean> {
	if (el.src !== url) {
		el.src = url;
		if (offsetSec > 0) {
			el.addEventListener('loadedmetadata', () => (el.currentTime = offsetSec), { once: true });
		}
	} else {
		el.currentTime = offsetSec;
	}
	return el.play().then(
		() => true,
		() => false,
	);
}

/** Call inside a tap. Starts the night from its first second if the track is already built. */
export function startNightTrack(spec: NightTrackSpec): boolean {
	const url = readyNightTrack(spec);
	const el = tableAudio();
	if (!url || !el) return false;
	void playFrom(el, url, 0);
	return true;
}

/** Resolves false when the browser wants a tap first. */
export function playNightTrack(url: string, offsetSec: number): Promise<boolean> {
	const el = tableAudio();
	return el ? playFrom(el, url, offsetSec) : Promise.resolve(false);
}

/**
 * Keeps the track on the server clock. Returns false when it is not running
 * (paused by a call, or never allowed to start) so the host can tap to resume.
 */
export function syncNightTrack(url: string, spec: NightTrackSpec, expectedSec: number): boolean {
	const el = tableAudio();
	if (!el || el.src !== url) return false;
	if (expectedSec >= nightTrackSeconds(spec)) return true;
	if (el.paused) return false;
	if (el.readyState >= 1 && Math.abs(el.currentTime - expectedSec) > 0.75)
		el.currentTime = expectedSec;
	return true;
}

export function stopTableAudio(): void {
	tableEl?.pause();
}

/**
 * Call inside a tap: one round at the chosen length, bell, voice and clock.
 * Plays at once when it is already built; otherwise unlocks the element and plays when ready.
 */
export function playRoundPreview(
	locale: NightTrackSpec['locale'],
	hourSeconds: number,
): Promise<boolean> {
	const el = tableAudio();
	if (!el) return Promise.resolve(false);
	const url = readyRoundPreview(locale, hourSeconds);
	if (url) return playFrom(el, url, 0);
	void playFrom(el, silentClipUrl(), 0);
	return prepareRoundPreview(locale, hourSeconds).then((built) =>
		built ? playFrom(el, built, 0) : false,
	);
}

/** One recorded line, e.g. "the cheese is gone". Call inside a tap. */
export function playVoiceClip(locale: NightTrackSpec['locale'], clip: VoiceClip): Promise<boolean> {
	const el = tableAudio();
	return el ? playFrom(el, clipUrl(locale, clip), 0) : Promise.resolve(false);
}

function context(): AudioContext | null {
	if (typeof window === 'undefined') return null;
	if (!audioCtx) {
		const Ctx =
			window.AudioContext ||
			(window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
		if (!Ctx) return null;
		audioCtx = new Ctx();
	}
	return audioCtx;
}

export function unlockTableAudio(): void {
	const ctx = context();
	if (!ctx) return;
	void ctx.resume();
	const buffer = ctx.createBuffer(1, 1, 22050);
	const source = ctx.createBufferSource();
	source.buffer = buffer;
	source.connect(ctx.destination);
	source.start();
	const el = tableAudio();
	if (el && el.paused) void playFrom(el, silentClipUrl(), 0);
	if (typeof window !== 'undefined' && window.speechSynthesis) {
		const primer = new SpeechSynthesisUtterance('\u200b');
		primer.volume = 0.01;
		window.speechSynthesis.speak(primer);
	}
}

export function narrationSuspended(): boolean {
	return !audioCtx || audioCtx.state === 'suspended';
}

function tone(freq: number, duration: number, volume: number): void {
	const ctx = context();
	if (!ctx || ctx.state !== 'running') return;
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();
	osc.frequency.value = freq;
	osc.type = 'sine';
	gain.gain.setValueAtTime(volume, ctx.currentTime);
	gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
	osc.connect(gain);
	gain.connect(ctx.destination);
	osc.start();
	osc.stop(ctx.currentTime + duration);
}

export function playClockTick(): void {
	tone(880, 0.04, 0.03);
}

export function playHourChime(): void {
	tone(523, 0.18, 0.06);
}

/** Returns false when this device has no voice for the locale — the host shows the line instead. */
export function speakLine(text: string, locale: 'vi' | 'en'): boolean {
	if (typeof window === 'undefined' || !window.speechSynthesis) return false;
	const voices = window.speechSynthesis.getVoices();
	const prefix = locale === 'vi' ? 'vi' : 'en';
	const voice = voices.find((item) => item.lang.toLowerCase().startsWith(prefix));
	if (!voice) return false;
	window.speechSynthesis.cancel();
	const utterance = new SpeechSynthesisUtterance(text);
	utterance.voice = voice;
	utterance.lang = voice.lang;
	utterance.rate = 0.92;
	window.speechSynthesis.speak(utterance);
	return true;
}
