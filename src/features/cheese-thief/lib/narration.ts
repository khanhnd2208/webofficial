/**
 * Host-only audio. Created from the "Start the night" tap so iOS will speak later.
 * Player phones never call this — a buzz or a chime would give away who is awake.
 */

let audioCtx: AudioContext | null = null;

function context(): AudioContext | null {
	if (typeof window === 'undefined') return null;
	if (!audioCtx) {
		const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
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
