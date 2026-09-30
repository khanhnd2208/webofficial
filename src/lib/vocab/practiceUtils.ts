/* ════════════════════════════════════════════════════════════════════════
   practiceUtils.ts — Shared utilities for all 4 practice modes
   (flashcards, mcq, fill-blank, matching)
   
   Previously duplicated across 4 pages. Now extracted here.
   ════════════════════════════════════════════════════════════════════════ */

/**
 * Fisher-Yates shuffle — returns a new array, does not mutate the input.
 */
export function shuffleArray<T>(array: T[]): T[] {
	const arr = [...array];
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

/**
 * Format accuracy percentage (0-100) to a display string.
 */
export function formatAccuracy(correct: number, total: number): string {
	if (total === 0) return '0%';
	return `${Math.round((correct / total) * 100)}%`;
}

/**
 * Speak a word using the Web Speech API.
 * Falls back silently if speech synthesis is not available.
 */
export function speakWord(text: string, lang = 'en-US', rate = 0.9): void {
	if (typeof window === 'undefined' || !window.speechSynthesis) return;
	window.speechSynthesis.cancel();
	const utter = new SpeechSynthesisUtterance(text);
	utter.lang = lang;
	utter.rate = rate;
	window.speechSynthesis.speak(utter);
}

/**
 * Generate a short audio feedback tone using Web Audio API.
 * @param type 'correct' | 'wrong' | 'success'
 */
export function generateSound(type: 'correct' | 'wrong' | 'success'): void {
	if (typeof window === 'undefined') return;
	try {
		const ctx = new AudioContext();
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.connect(gain);
		gain.connect(ctx.destination);

		if (type === 'correct') {
			osc.frequency.setValueAtTime(880, ctx.currentTime);
			osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
			gain.gain.setValueAtTime(0.3, ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
			osc.start(ctx.currentTime);
			osc.stop(ctx.currentTime + 0.3);
		} else if (type === 'wrong') {
			osc.type = 'sawtooth';
			osc.frequency.setValueAtTime(220, ctx.currentTime);
			gain.gain.setValueAtTime(0.3, ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
			osc.start(ctx.currentTime);
			osc.stop(ctx.currentTime + 0.4);
		} else {
			// success fanfare
			const notes = [523, 659, 784, 1047];
			notes.forEach((freq, i) => {
				const o2 = ctx.createOscillator();
				const g2 = ctx.createGain();
				o2.connect(g2);
				g2.connect(ctx.destination);
				o2.frequency.value = freq;
				g2.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.12);
				g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);
				o2.start(ctx.currentTime + i * 0.12);
				o2.stop(ctx.currentTime + i * 0.12 + 0.3);
			});
		}
	} catch {
		// Web Audio not available — fail silently
	}
}
