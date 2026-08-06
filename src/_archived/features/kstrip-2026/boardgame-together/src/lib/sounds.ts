const STORAGE_KEY = 'kstrip-sounds-enabled';

let audioCtx: AudioContext | null = null;

export function isSoundsEnabled(): boolean {
	if (typeof window === 'undefined') return false;
	return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function setSoundsEnabled(enabled: boolean) {
	if (typeof window === 'undefined') return;
	localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
}

function getCtx(): AudioContext | null {
	if (typeof window === 'undefined') return null;
	if (!audioCtx) {
		try {
			audioCtx = new AudioContext();
		} catch {
			return null;
		}
	}
	return audioCtx;
}

function beep(freq: number, duration: number, volume = 0.08) {
	if (!isSoundsEnabled()) return;
	const ctx = getCtx();
	if (!ctx) return;
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();
	osc.connect(gain);
	gain.connect(ctx.destination);
	osc.frequency.value = freq;
	gain.gain.value = volume;
	osc.start();
	osc.stop(ctx.currentTime + duration);
}

export function playTap() {
	beep(440, 0.05);
}

export function playConfirm() {
	beep(523, 0.08);
	beep(659, 0.1);
}

export function playUrgent() {
	beep(880, 0.06);
	beep(660, 0.06);
}
